import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/pages/auth_providers.dart';

class Command {
  final String id;
  final String type;
  final String status;
  final String priority;
  final Map<String, dynamic> payload;
  final String riskLevel;
  final String? userId;
  final String? userEmail;
  final String? deviceId;
  final String origin;
  final String approvalType;
  final String approvalStatus;
  final List<dynamic> approvers;
  final String scheduledAt;
  final String createdAt;
  final String? startedAt;
  final String? completedAt;
  final int? durationMs;
  final int retryCount;
  final int maxRetries;
  final String? errorMessage;
  final Map<String, dynamic>? result;
  final Map<String, dynamic>? rollbackResult;

  Command({
    required this.id,
    required this.type,
    required this.status,
    required this.priority,
    required this.payload,
    required this.riskLevel,
    this.userId,
    this.userEmail,
    this.deviceId,
    required this.origin,
    required this.approvalType,
    required this.approvalStatus,
    required this.approvers,
    required this.scheduledAt,
    required this.createdAt,
    this.startedAt,
    this.completedAt,
    this.durationMs,
    required this.retryCount,
    required this.maxRetries,
    this.errorMessage,
    this.result,
    this.rollbackResult,
  });

  factory Command.fromJson(Map<String, dynamic> json) {
    return Command(
      id: json['id'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      payload: (json['payload'] ?? {}) as Map<String, dynamic>,
      riskLevel: json['riskLevel'] as String,
      userId: json['userId'] as String?,
      userEmail: json['userEmail'] as String?,
      deviceId: json['deviceId'] as String?,
      origin: json['origin'] as String,
      approvalType: json['approvalType'] as String,
      approvalStatus: json['approvalStatus'] as String,
      approvers: (json['approvers'] ?? []) as List<dynamic>,
      scheduledAt: json['scheduledAt'] as String,
      createdAt: json['createdAt'] as String,
      startedAt: json['startedAt'] as String?,
      completedAt: json['completedAt'] as String?,
      durationMs: json['durationMs'] as int?,
      retryCount: json['retryCount'] as int? ?? 0,
      maxRetries: json['maxRetries'] as int? ?? 3,
      errorMessage: json['errorMessage'] as String?,
      result: json['result'] as Map<String, dynamic>?,
      rollbackResult: json['rollbackResult'] as Map<String, dynamic>?,
    );
  }
}

class CommandsState {
  final List<Command> commands;
  final bool isLoading;
  final String? error;
  final bool isWsConnected;

  CommandsState({
    required this.commands,
    required this.isLoading,
    this.error,
    required this.isWsConnected,
  });

  CommandsState copyWith({
    List<Command>? commands,
    bool? isLoading,
    String? error,
    bool? isWsConnected,
  }) {
    return CommandsState(
      commands: commands ?? this.commands,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      isWsConnected: isWsConnected ?? this.isWsConnected,
    );
  }
}

class CommandsNotifier extends StateNotifier<CommandsState> {
  final Ref _ref;
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  bool _isDisposed = false;

  CommandsNotifier(this._ref)
      : super(CommandsState(
          commands: [],
          isLoading: false,
          isWsConnected: false,
        )) {
    fetchCommands();
    connectWebSocket();
  }

  Future<void> fetchCommands() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/mobile/commands');
      final data = response.data;
      final List<dynamic> list = data['commands'] ?? [];
      final parsed = list.map((json) => Command.fromJson(json)).toList();
      state = state.copyWith(commands: parsed, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to fetch commands: $e');
    }
  }

  Future<void> connectWebSocket() async {
    if (_isDisposed) return;

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
      final wsUrl = '$wsScheme://${uri.host}:3001/mobile/commands/live?token=$jwt&compress=zlib';

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

      if (type == 'COMMANDS_SNAPSHOT') {
        final List<dynamic> list = data['commands'] ?? [];
        final parsed = list.map((json) => Command.fromJson(json)).toList();
        state = state.copyWith(commands: parsed);
      } else if (type == 'COMMAND_UPDATE') {
        final updatedCmd = Command.fromJson(data['command']);
        final index = state.commands.indexWhere((c) => c.id == updatedCmd.id);
        
        List<Command> newList = [...state.commands];
        if (index >= 0) {
          newList[index] = updatedCmd;
        } else {
          newList.insert(0, updatedCmd);
        }
        state = state.copyWith(commands: newList);
      }
    } catch (e) {
      debugPrint('Failed to parse WebSocket commands: $e');
    }
  }

  void _handleWsDisconnect() {
    state = state.copyWith(isWsConnected: false);
    _channel = null;
    
    // Attempt reconnect after backoff
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      connectWebSocket();
    });
  }

  Future<bool> submitCommand({
    required String type,
    required Map<String, dynamic> payload,
    String priority = 'MEDIUM',
    bool emergencyOverride = false,
  }) async {
    try {
      final secureStorage = _ref.read(secureStorageProvider);
      final apiClient = _ref.read(apiClientProvider);
      final deviceId = await secureStorage.getDeviceId();
      if (deviceId == null) return false;

      final nonce = 'nonce-${DateTime.now().microsecondsSinceEpoch}';
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      const signature = 'MEQCIEq6d6aJ4/X7...simulatedSignatureBase64...';

      final response = await apiClient.dio.post(
        '/mobile/commands',
        data: {
          'type': type,
          'priority': priority,
          'payload': payload,
          'deviceId': deviceId,
          'signature': signature,
          'replayNonce': nonce,
          'timestamp': timestamp,
          'emergencyOverride': emergencyOverride,
        },
      );

      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Command submission failed: $e');
      return false;
    }
  }

  Future<bool> approveCommand(String commandId) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      const signature = 'MEQCIEq6d6aJ4/X7...simulatedSignatureBase64...';
      
      final response = await apiClient.dio.post(
        '/mobile/commands/$commandId/approve',
        data: {'signature': signature},
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Approve command failed: $e');
      return false;
    }
  }

  Future<bool> rejectCommand(String commandId) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      const signature = 'MEQCIEq6d6aJ4/X7...simulatedSignatureBase64...';

      final response = await apiClient.dio.post(
        '/mobile/commands/$commandId/reject',
        data: {'signature': signature},
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Reject command failed: $e');
      return false;
    }
  }

  Future<bool> cancelCommand(String commandId) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.dio.post('/mobile/commands/$commandId/cancel');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Cancel command failed: $e');
      return false;
    }
  }

  Future<bool> rollbackCommand(String commandId) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      final response = await apiClient.dio.post('/mobile/commands/$commandId/rollback');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Rollback command failed: $e');
      return false;
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    super.dispose();
  }
}

final commandsProvider = StateNotifierProvider<CommandsNotifier, CommandsState>((ref) {
  return CommandsNotifier(ref);
});
