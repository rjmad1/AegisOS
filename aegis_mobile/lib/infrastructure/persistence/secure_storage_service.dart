import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
        );

  static const String _keyJwtToken = 'jwt_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyPrivateKey = 'ecdsa_private_key';
  static const String _keyPublicKey = 'ecdsa_public_key';
  static const String _keyCaFingerprint = 'pinned_ca_fingerprint';
  static const String _keyDeviceId = 'device_id';

  Future<void> saveJwtToken(String token) async {
    await _storage.write(key: _keyJwtToken, value: token);
  }

  Future<String?> getJwtToken() async {
    return await _storage.read(key: _keyJwtToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _keyRefreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  Future<void> savePrivateKey(String key) async {
    await _storage.write(key: _keyPrivateKey, value: key);
  }

  Future<String?> getPrivateKey() async {
    return await _storage.read(key: _keyPrivateKey);
  }

  Future<void> savePublicKey(String key) async {
    await _storage.write(key: _keyPublicKey, value: key);
  }

  Future<String?> getPublicKey() async {
    return await _storage.read(key: _keyPublicKey);
  }

  Future<void> saveCaFingerprint(String fingerprint) async {
    await _storage.write(key: _keyCaFingerprint, value: fingerprint);
  }

  Future<String?> getCaFingerprint() async {
    return await _storage.read(key: _keyCaFingerprint);
  }

  Future<void> saveDeviceId(String deviceId) async {
    await _storage.write(key: _keyDeviceId, value: deviceId);
  }

  Future<String?> getDeviceId() async {
    return await _storage.read(key: _keyDeviceId);
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _keyJwtToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyPrivateKey);
    await _storage.delete(key: _keyPublicKey);
    await _storage.delete(key: _keyCaFingerprint);
    await _storage.delete(key: _keyDeviceId);
  }
}
