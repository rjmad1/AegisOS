import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../auth/presentation/pages/auth_providers.dart';

class PlanStep {
  final String description;
  final String commandType;
  final Map<String, dynamic> payload;
  final int estimatedDurationMs;
  final String riskLevel;
  String status; // "QUEUED" | "PENDING_APPROVAL" | "RUNNING" | "COMPLETED" | "FAILED"

  PlanStep({
    required this.description,
    required this.commandType,
    required this.payload,
    required this.estimatedDurationMs,
    required this.riskLevel,
    this.status = "QUEUED",
  });

  factory PlanStep.fromJson(Map<String, dynamic> json) {
    return PlanStep(
      description: json['description'] as String,
      commandType: json['commandType'] as String,
      payload: (json['payload'] ?? {}) as Map<String, dynamic>,
      estimatedDurationMs: json['estimatedDurationMs'] as int? ?? 1000,
      riskLevel: json['riskLevel'] as String,
      status: json['status'] as String? ?? "QUEUED",
    );
  }
}

class ExecutionPlan {
  final List<PlanStep> steps;
  final int totalDurationMs;
  final String overallRisk;
  final bool rollbackAvailable;
  final bool approvalRequired;

  ExecutionPlan({
    required this.steps,
    required this.totalDurationMs,
    required this.overallRisk,
    required this.rollbackAvailable,
    required this.approvalRequired,
  });

  factory ExecutionPlan.fromJson(Map<String, dynamic> json) {
    final list = json['steps'] as List<dynamic>? ?? [];
    return ExecutionPlan(
      steps: list.map((e) => PlanStep.fromJson(e as Map<String, dynamic>)).toList(),
      totalDurationMs: json['totalDurationMs'] as int? ?? 0,
      overallRisk: json['overallRisk'] as String? ?? "LOW",
      rollbackAvailable: json['rollbackAvailable'] as bool? ?? false,
      approvalRequired: json['approvalRequired'] as bool? ?? false,
    );
  }
}

class AssistantMessage {
  final String id;
  final String role; // "user" | "assistant"
  final String content;
  final String? intent;
  final ExecutionPlan? plan;
  final String? timestamp;
  List<String>? commandIds; // references to C2 commands

  AssistantMessage({
    required this.id,
    required this.role,
    required this.content,
    this.intent,
    this.plan,
    this.timestamp,
    this.commandIds,
  });

  factory AssistantMessage.fromJson(Map<String, dynamic> json) {
    final planJson = json['executionPlan'] != null
        ? jsonDecode(json['executionPlan'] as String)
        : null;
    
    final cmdJson = json['commands'] != null
        ? List<String>.from(jsonDecode(json['commands'] as String))
        : null;

    return AssistantMessage(
      id: json['id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      intent: json['intent'] as String?,
      plan: planJson != null ? ExecutionPlan.fromJson(planJson) : null,
      timestamp: json['createdAt'] as String?,
      commandIds: cmdJson,
    );
  }
}

class AssistantState {
  final List<AssistantMessage> messages;
  final String? activeConversationId;
  final bool isLoading;
  final String? error;
  final bool isWsConnected;

  AssistantState({
    required this.messages,
    this.activeConversationId,
    required this.isLoading,
    this.error,
    required this.isWsConnected,
  });

  AssistantState copyWith({
    List<AssistantMessage>? messages,
    String? activeConversationId,
    bool? isLoading,
    String? error,
    bool? isWsConnected,
  }) {
    return AssistantState(
      messages: messages ?? this.messages,
      activeConversationId: activeConversationId ?? this.activeConversationId,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      isWsConnected: isWsConnected ?? this.isWsConnected,
    );
  }
}

class AssistantNotifier extends StateNotifier<AssistantState> {
  final Ref _ref;
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  bool _isDisposed = false;

  AssistantNotifier(this._ref)
      : super(AssistantState(
          messages: [],
          isLoading: false,
          isWsConnected: false,
        )) {
    loadHistory();
  }

  Future<void> loadHistory() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/mobile/assistant/history');
      final data = response.data;
      final List<dynamic> threads = data['history'] ?? [];

      if (threads.isNotEmpty) {
        final activeThread = threads[0];
        final List<dynamic> msgsJson = activeThread['messages'] ?? [];
        final parsed = msgsJson.map((m) => AssistantMessage.fromJson(m)).toList();
        
        state = state.copyWith(
          activeConversationId: activeThread['id'] as String,
          messages: parsed,
          isLoading: false,
        );
        connectWebSocket();
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load assistant history: $e');
    }
  }

  Future<void> connectWebSocket() async {
    if (_isDisposed || state.activeConversationId == null) return;

    final secureStorage = _ref.read(secureStorageProvider);
    final db = _ref.read(databaseProvider);

    final deviceId = await secureStorage.getDeviceId();
    final jwt = await secureStorage.getJwtToken();
    if (deviceId == null || jwt == null) return;

    final workstation = db.getWorkstation(deviceId);
    if (workstation == null) return;

    try {
      final uri = Uri.parse(workstation['hostAddress']);
      final wsScheme = uri.scheme == 'https' ? 'wss' : 'ws';
      final wsUrl = '$wsScheme://${uri.host}:3001/mobile/assistant/live?token=$jwt';

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      state = state.copyWith(isWsConnected: true);

      _channel!.stream.listen(
        (message) {
          _handleWsMessage(message);
        },
        onError: (err) => _handleWsDisconnect(),
        onDone: () => _handleWsDisconnect(),
        cancelOnError: true,
      );
    } catch (e) {
      _handleWsDisconnect();
    }
  }

  void _handleWsMessage(dynamic message) {
    try {
      final Map<String, dynamic> data = json.decode(message);
      final String type = data['type'];

      if (type == 'ASSISTANT_COMMAND_UPDATE') {
        final String commandId = data['commandId'];
        final String status = data['status'];

        // Find which step in which message contains this commandId
        final updatedMessages = state.messages.map((msg) {
          if (msg.plan != null && msg.commandIds != null && msg.commandIds!.contains(commandId)) {
            final cmdIdx = msg.commandIds!.indexOf(commandId);
            if (cmdIdx < msg.plan!.steps.length) {
              msg.plan!.steps[cmdIdx].status = status;
            }
          }
          return msg;
        }).toList();

        state = state.copyWith(messages: updatedMessages);
      }
    } catch (e) {
      debugPrint('Failed to parse WebSocket assistant message: $e');
    }
  }

  void _handleWsDisconnect() {
    state = state.copyWith(isWsConnected: false);
    _channel = null;
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      connectWebSocket();
    });
  }

  Future<void> sendMessage(String text) async {
    // 1. Add user message locally
    final userMsg = AssistantMessage(
      id: 'local-${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: text,
    );
    state = state.copyWith(messages: [...state.messages, userMsg], isLoading: true);

    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.dio.post(
        '/mobile/assistant/chat',
        data: {
          'conversationId': state.activeConversationId,
          'content': text,
        },
      );

      final data = response.data;
      final String conversationId = data['conversationId'];
      final msg = AssistantMessage.fromJson(data['message']);

      state = state.copyWith(
        activeConversationId: conversationId,
        messages: [...state.messages.where((m) => m.id != userMsg.id), userMsg, msg],
        isLoading: false,
      );

      if (_channel == null) {
        connectWebSocket();
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to send message: $e');
    }
  }

  Future<bool> executePlan(String messageId) async {
    state = state.copyWith(isLoading: true);
    try {
      final secureStorage = _ref.read(secureStorageProvider);
      final apiClient = _ref.read(apiClientProvider);
      final deviceId = await secureStorage.getDeviceId();
      if (deviceId == null) return false;

      final nonce = 'nonce-${DateTime.now().microsecondsSinceEpoch}';
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      const signature = 'MEQCIEq6d6aJ4/X7...simulatedSignatureBase64...';

      final response = await apiClient.dio.post(
        '/mobile/assistant/execute',
        data: {
          'messageId': messageId,
          'deviceId': deviceId,
          'signature': signature,
          'replayNonce': nonce,
          'timestamp': timestamp,
        },
      );

      final data = response.data;
      final List<dynamic> commandIds = data['commandIds'] ?? [];

      // Update command references locally
      final updatedMessages = state.messages.map((m) {
        if (m.id == messageId) {
          m.commandIds = List<String>.from(commandIds);
        }
        return m;
      }).toList();

      state = state.copyWith(messages: updatedMessages, isLoading: false);
      return response.statusCode == 200;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Plan execution failed: $e');
      return false;
    }
  }

  Future<void> clearChat() async {
    state = state.copyWith(messages: [], activeConversationId: null, error: null);
  }

  @override
  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    super.dispose();
  }
}

final assistantProvider = StateNotifierProvider<AssistantNotifier, AssistantState>((ref) {
  return AssistantNotifier(ref);
});
