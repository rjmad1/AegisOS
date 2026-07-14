import 'dart:async';
import 'package:logger/logger.dart';

class SyncEngine {
  final Logger _logger;
  Timer? _syncTimer;
  int _lastSyncAnchor = 0;
  bool _isSyncing = false;

  SyncEngine(this._logger);

  // Initialize background periodic synchronizer (default interval 15 minutes)
  void startPeriodicSync() {
    _logger.i('SyncEngine: Starting periodic synchronization scheduling...');
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(minutes: 15), (timer) async {
      await runSync();
    });
  }

  void stopPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
    _logger.i('SyncEngine: Stopped periodic synchronization.');
  }

  // Force trigger sync delta calculation
  Future<void> runSync() async {
    if (_isSyncing) {
      _logger.d('SyncEngine: Synchronization execution already in progress. Skipping.');
      return;
    }

    _isSyncing = true;
    _logger.i('SyncEngine: Initiating delta synchronization pull since anchor: $_lastSyncAnchor...');

    try {
      // Simulate API fetch delta payload
      await Future<void>.delayed(const Duration(seconds: 2));

      // Update anchor to indicate sync success
      _lastSyncAnchor = DateTime.now().millisecondsSinceEpoch;
      _logger.i('SyncEngine: Synchronization delta applied successfully. New anchor: $_lastSyncAnchor');
    } catch (e) {
      _logger.e('SyncEngine: Synchronization process encountered error: $e');
    } finally {
      _isSyncing = false;
    }
  }

  int get lastSyncAnchor => _lastSyncAnchor;
  bool get isSyncing => _isSyncing;
}
