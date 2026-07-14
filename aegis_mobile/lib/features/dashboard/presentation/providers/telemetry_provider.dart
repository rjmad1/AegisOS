import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import '../../../auth/presentation/pages/auth_providers.dart';

enum TelemetryConnectionStatus {
  disconnected,
  connecting,
  connected,
}

class TelemetryState {
  final TelemetryConnectionStatus status;
  final Map<String, dynamic>? data;
  final String? error;
  final List<double> cpuHistory;
  final List<double> gpuHistory;

  TelemetryState({
    required this.status,
    this.data,
    this.error,
    required this.cpuHistory,
    required this.gpuHistory,
  });

  TelemetryState copyWith({
    TelemetryConnectionStatus? status,
    Map<String, dynamic>? data,
    String? error,
    List<double>? cpuHistory,
    List<double>? gpuHistory,
  }) {
    return TelemetryState(
      status: status ?? this.status,
      data: data ?? this.data,
      error: error ?? this.error,
      cpuHistory: cpuHistory ?? this.cpuHistory,
      gpuHistory: gpuHistory ?? this.gpuHistory,
    );
  }
}

class TelemetryNotifier extends StateNotifier<TelemetryState> {
  final Ref _ref;
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  int _reconnectDelaySeconds = 2;
  bool _isDisposed = false;
  
  final List<double> _cpuHistoryList = [];
  final List<double> _gpuHistoryList = [];

  TelemetryNotifier(this._ref)
      : super(TelemetryState(
          status: TelemetryConnectionStatus.disconnected,
          cpuHistory: const [],
          gpuHistory: const [],
        )) {
    _loadCachedTelemetry();
    _connect();
  }

  Future<File> get _cacheFile async {
    final directory = await getApplicationDocumentsDirectory();
    return File(p.join(directory.path, 'telemetry_cache.json'));
  }

  Future<void> _loadCachedTelemetry() async {
    try {
      final file = await _cacheFile;
      if (await file.exists()) {
        final content = await file.readAsString();
        final Map<String, dynamic> decoded = json.decode(content);
        if (state.status == TelemetryConnectionStatus.disconnected) {
          state = state.copyWith(data: decoded);
        }
      }
    } catch (e) {
      debugPrint('Failed to load cached telemetry: $e');
    }
  }

  Future<void> _saveTelemetryToCache(Map<String, dynamic> data) async {
    try {
      final file = await _cacheFile;
      await file.writeAsString(json.encode(data));
    } catch (e) {
      debugPrint('Failed to cache telemetry: $e');
    }
  }

  Future<void> _connect() async {
    if (_isDisposed) return;

    final secureStorage = _ref.read(secureStorageProvider);
    final db = _ref.read(databaseProvider);

    final deviceId = await secureStorage.getDeviceId();
    final jwt = await secureStorage.getJwtToken();
    if (deviceId == null || jwt == null) {
      state = state.copyWith(status: TelemetryConnectionStatus.disconnected);
      return;
    }

    final workstation = db.getWorkstation(deviceId);
    if (workstation == null) {
      state = state.copyWith(status: TelemetryConnectionStatus.disconnected);
      return;
    }

    state = state.copyWith(status: TelemetryConnectionStatus.connecting);

    try {
      final uri = Uri.parse(workstation['hostAddress']);
      final wsScheme = uri.scheme == 'https' ? 'wss' : 'ws';
      final wsUrl = '$wsScheme://${uri.host}:3001/mobile/live?token=$jwt&compress=zlib';

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _channel!.stream.listen(
        (message) {
          _handleIncomingMessage(message);
        },
        onError: (err) {
          _handleDisconnect('Connection error: $err');
        },
        onDone: () {
          _handleDisconnect('Connection closed by server.');
        },
        cancelOnError: true,
      );

      state = state.copyWith(
        status: TelemetryConnectionStatus.connected,
        error: null,
      );
      _reconnectDelaySeconds = 2; // Reset reconnect backoff
      _startHeartbeat();
    } catch (e) {
      _handleDisconnect('Failed to connect: $e');
    }
  }

  void _handleIncomingMessage(dynamic message) {
    try {
      Map<String, dynamic> decodedData;

      if (message is List<int>) {
        final decompressed = zlib.decode(message);
        final jsonString = utf8.decode(decompressed);
        decodedData = json.decode(jsonString);
      } else if (message is String) {
        decodedData = json.decode(message);
      } else {
        throw const FormatException('Unsupported frame type');
      }

      // Record load history
      final double cpuVal = (decodedData['cpu']?['load'] ?? 0).toDouble();
      final double gpuVal = (decodedData['gpu']?['utilization'] ?? 0).toDouble();

      _cpuHistoryList.add(cpuVal);
      if (_cpuHistoryList.length > 20) _cpuHistoryList.removeAt(0);

      _gpuHistoryList.add(gpuVal);
      if (_gpuHistoryList.length > 20) _gpuHistoryList.removeAt(0);

      state = state.copyWith(
        status: TelemetryConnectionStatus.connected,
        data: decodedData,
        cpuHistory: List.from(_cpuHistoryList),
        gpuHistory: List.from(_gpuHistoryList),
      );

      _saveTelemetryToCache(decodedData);
    } catch (e) {
      debugPrint('Error parsing telemetry payload: $e');
    }
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (state.status == TelemetryConnectionStatus.connected && _channel != null) {
        _channel!.sink.add(json.encode({'type': 'ping', 'timestamp': DateTime.now().millisecondsSinceEpoch}));
      }
    });
  }

  void _handleDisconnect(String reason) {
    _channel = null;
    _heartbeatTimer?.cancel();
    state = state.copyWith(status: TelemetryConnectionStatus.disconnected, error: reason);
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (_isDisposed) return;

    _reconnectTimer = Timer(Duration(seconds: _reconnectDelaySeconds), () {
      _connect();
    });

    _reconnectDelaySeconds = (_reconnectDelaySeconds * 2).clamp(2, 32);
  }

  Future<void> refresh() async {
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _connect();
  }

  @override
  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _heartbeatTimer?.cancel();
    _channel?.sink.close();
    super.dispose();
  }
}

final telemetryProvider = StateNotifierProvider<TelemetryNotifier, TelemetryState>((ref) {
  final notifier = TelemetryNotifier(ref);
  ref.onDispose(() => notifier.dispose());
  return notifier;
});
