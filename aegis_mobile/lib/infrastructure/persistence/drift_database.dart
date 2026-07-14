import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart';

class AppDatabase {
  static AppDatabase? _instance;
  final Database _db;

  AppDatabase._(this._db);

  static Future<AppDatabase> getInstance() async {
    if (_instance != null) return _instance!;
    
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'aegis_local.db'));
    
    // Open the local SQLite database file
    final db = sqlite3.open(file.path);
    final instance = AppDatabase._(db);
    instance._initSchema();
    _instance = instance;
    return _instance!;
  }

  void _initSchema() {
    // 1. Workstations table
    _db.execute('''
      CREATE TABLE IF NOT EXISTS workstations (
        id TEXT PRIMARY KEY,
        host_address TEXT NOT NULL,
        host_name TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        status TEXT NOT NULL,
        paired_at INTEGER NOT NULL
      );
    ''');

    // 2. Sessions table
    _db.execute('''
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        jwt_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        status TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    ''');

    // 3. Local Audit Logs table
    _db.execute('''
      CREATE TABLE IF NOT EXISTS local_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    ''');

    // 4. Offline Action Queue table
    _db.execute('''
      CREATE TABLE IF NOT EXISTS offline_action_queue (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        signed_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    ''');
  }

  // ---- Database Queries & Mutations ----

  // Workstations
  void saveWorkstation(Map<String, dynamic> w) {
    _db.execute(
      'INSERT OR REPLACE INTO workstations (id, host_address, host_name, fingerprint, status, paired_at) VALUES (?, ?, ?, ?, ?, ?)',
      [w['id'], w['hostAddress'], w['hostName'], w['fingerprint'], w['status'], w['pairedAt']],
    );
  }

  Map<String, dynamic>? getWorkstation(String id) {
    final ResultSet results = _db.select('SELECT * FROM workstations WHERE id = ? LIMIT 1', [id]);
    if (results.isEmpty) return null;
    final row = results.first;
    return {
      'id': row['id'],
      'hostAddress': row['host_address'],
      'hostName': row['host_name'],
      'fingerprint': row['fingerprint'],
      'status': row['status'],
      'pairedAt': row['paired_at'],
    };
  }

  List<Map<String, dynamic>> getWorkstations() {
    final ResultSet results = _db.select('SELECT * FROM workstations ORDER BY paired_at DESC');
    return results.map((row) => {
      'id': row['id'],
      'hostAddress': row['host_address'],
      'hostName': row['host_name'],
      'fingerprint': row['fingerprint'],
      'status': row['status'],
      'pairedAt': row['paired_at'],
    }).toList();
  }

  void deleteWorkstation(String id) {
    _db.execute('DELETE FROM workstations WHERE id = ?', [id]);
  }

  // Sessions
  void saveSession(Map<String, dynamic> s) {
    _db.execute(
      'INSERT OR REPLACE INTO sessions (id, jwt_token, refresh_token, status, expires_at) VALUES (?, ?, ?, ?, ?)',
      [s['id'], s['jwtToken'], s['refreshToken'], s['status'], s['expiresAt']],
    );
  }

  Map<String, dynamic>? getActiveSession() {
    final ResultSet results = _db.select('SELECT * FROM sessions WHERE status = ? LIMIT 1', ['ACTIVE']);
    if (results.isEmpty) return null;
    final row = results.first;
    return {
      'id': row['id'],
      'jwtToken': row['jwt_token'],
      'refreshToken': row['refresh_token'],
      'status': row['status'],
      'expiresAt': row['expires_at'],
    };
  }

  void clearSession() {
    _db.execute('UPDATE sessions SET status = ?', ['EXPIRED']);
  }

  // Audit Logs
  void logEvent(String action, String details) {
    _db.execute(
      'INSERT INTO local_audit_logs (action, details, timestamp) VALUES (?, ?, ?)',
      [action, details, DateTime.now().millisecondsSinceEpoch],
    );
  }

  List<Map<String, dynamic>> getAuditLogs() {
    final ResultSet results = _db.select('SELECT * FROM local_audit_logs ORDER BY timestamp DESC LIMIT 100');
    return results.map((row) => {
      'id': row['id'],
      'action': row['action'],
      'details': row['details'],
      'timestamp': row['timestamp'],
    }).toList();
  }

  // Offline Action Queue
  void queueAction(Map<String, dynamic> action) {
    _db.execute(
      'INSERT OR REPLACE INTO offline_action_queue (id, action_type, payload_json, signed_hash, created_at, retry_count) VALUES (?, ?, ?, ?, ?, ?)',
      [action['id'], action['actionType'], action['payloadJson'], action['signedHash'], action['createdAt'], action['retryCount'] ?? 0],
    );
  }

  List<Map<String, dynamic>> getQueuedActions() {
    final ResultSet results = _db.select('SELECT * FROM offline_action_queue ORDER BY created_at ASC');
    return results.map((row) => {
      'id': row['id'],
      'actionType': row['action_type'],
      'payloadJson': row['payload_json'],
      'signedHash': row['signed_hash'],
      'createdAt': row['created_at'],
      'retryCount': row['retry_count'],
    }).toList();
  }

  void removeQueuedAction(String id) {
    _db.execute('DELETE FROM offline_action_queue WHERE id = ?', [id]);
  }

  void incrementRetryCount(String id) {
    _db.execute('UPDATE offline_action_queue SET retry_count = retry_count + 1 WHERE id = ?', [id]);
  }

  void close() {
    _db.dispose();
  }
}
