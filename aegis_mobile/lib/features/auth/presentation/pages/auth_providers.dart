import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../infrastructure/persistence/drift_database.dart';
import '../../../../infrastructure/persistence/secure_storage_service.dart';
import '../../../../infrastructure/network/api_client.dart';
import '../../../../infrastructure/security/biometric_service.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

// Overridden at bootstrap
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('databaseProvider must be overridden at bootstrap');
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  final db = ref.watch(databaseProvider);
  return ApiClient(secureStorage, db);
});

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService();
});

enum MobileAuthStatus {
  unpaired,
  pendingApproval,
  pairedLocked,
  pairedUnlocked,
}

class AuthNotifier extends StateNotifier<MobileAuthStatus> {
  final SecureStorageService _secureStorage;
  final AppDatabase _db;
  final ApiClient _apiClient;

  AuthNotifier(this._secureStorage, this._db, this._apiClient) : super(MobileAuthStatus.unpaired) {
    checkInitialState();
  }

  Future<void> checkInitialState() async {
    final deviceId = await _secureStorage.getDeviceId();
    if (deviceId == null) {
      state = MobileAuthStatus.unpaired;
      return;
    }

    final activeSession = _db.getActiveSession();
    final workstation = _db.getWorkstation(deviceId);

    if (workstation == null) {
      state = MobileAuthStatus.unpaired;
      return;
    }

    if (workstation['status'] == 'PENDING') {
      state = MobileAuthStatus.pendingApproval;
      // Resolve dynamic baseUrl if present
      _apiClient.setBaseUrl(workstation['hostAddress']);
      return;
    }

    if (activeSession != null) {
      // Session exists, check if expired
      final now = DateTime.now().millisecondsSinceEpoch;
      if (now < activeSession['expiresAt']) {
        // Active and not expired - lock it for safety until biometric passes
        state = MobileAuthStatus.pairedLocked;
      } else {
        // Expired session - attempt silent refresh
        final refreshed = await _apiClient.rotateSession();
        if (refreshed) {
          state = MobileAuthStatus.pairedLocked;
        } else {
          state = MobileAuthStatus.pairedLocked; // Prompt passcode fallback
        }
      }
      _apiClient.setBaseUrl(workstation['hostAddress']);
    } else {
      state = MobileAuthStatus.pairedLocked;
      _apiClient.setBaseUrl(workstation['hostAddress']);
    }
  }

  void setStatus(MobileAuthStatus status) {
    state = status;
  }

  Future<void> unlock() async {
    if (state == MobileAuthStatus.pairedLocked) {
      state = MobileAuthStatus.pairedUnlocked;
    }
  }

  Future<void> lock() async {
    if (state == MobileAuthStatus.pairedUnlocked) {
      state = MobileAuthStatus.pairedLocked;
    }
  }

  Future<void> logout() async {
    await _apiClient.clearLocalAuthData();
    state = MobileAuthStatus.unpaired;
  }
}

final authStateNotifierProvider = StateNotifierProvider<AuthNotifier, MobileAuthStatus>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  final db = ref.watch(databaseProvider);
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(secureStorage, db, apiClient);
});
