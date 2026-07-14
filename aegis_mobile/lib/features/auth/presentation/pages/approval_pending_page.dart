import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_providers.dart';

class ApprovalPendingPage extends ConsumerStatefulWidget {
  const ApprovalPendingPage({super.key});

  @override
  ConsumerState<ApprovalPendingPage> createState() => _ApprovalPendingPageState();
}

class _ApprovalPendingPageState extends ConsumerState<ApprovalPendingPage> {
  Timer? _pollingTimer;
  String? _deviceId;
  String? _publicKey;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDeviceDetails();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadDeviceDetails() async {
    final secureStorage = ref.read(secureStorageProvider);
    final devId = await secureStorage.getDeviceId();
    final pubKey = await secureStorage.getPublicKey();
    if (mounted) {
      setState(() {
        _deviceId = devId;
        _publicKey = pubKey;
      });
    }
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) async {
      await _checkApprovalStatus();
    });
  }

  Future<void> _checkApprovalStatus() async {
    final secureStorage = ref.read(secureStorageProvider);
    final apiClient = ref.read(apiClientProvider);
    final db = ref.read(databaseProvider);

    final devId = await secureStorage.getDeviceId();
    if (devId == null) return;

    try {
      // Establish cryptographic challenge-response signature
      final challenge = DateTime.now().millisecondsSinceEpoch.toString();
      // Generate simulated signature over the challenge
      const mockSignature = 'MEQCIEq6d6aJ4/X7...simulatedSignatureBase64...';

      final response = await apiClient.dio.post(
        '/mobile/auth/session',
        data: {
          'deviceId': devId,
          'challenge': challenge,
          'signature': mockSignature,
        },
        options: Options(
          validateStatus: (status) => status == 201 || status == 401 || status == 403,
        ),
      );

      if (response.statusCode == 201) {
        // Pairing approved! Save session tokens and navigate
        final data = response.data;
        final String jwt = data['jwt'];
        final String refresh = data['refreshToken'];
        final int expiresAt = data['expiresAt'];

        await secureStorage.saveJwtToken(jwt);
        await secureStorage.saveRefreshToken(refresh);

        // Update database
        db.saveSession({
          'id': devId,
          'jwtToken': jwt,
          'refreshToken': refresh,
          'status': 'ACTIVE',
          'expiresAt': expiresAt,
        });

        // Mark workstation as approved
        final workstation = db.getWorkstation(devId);
        if (workstation != null) {
          workstation['status'] = 'APPROVED';
          db.saveWorkstation(workstation);
        }

        db.logEvent('Pairing Completed', 'Workstation pairing approved and session established');
        _pollingTimer?.cancel();

        ref.read(authStateNotifierProvider.notifier).setStatus(MobileAuthStatus.pairedUnlocked);

        if (mounted) {
          context.go('/success');
        }
      } else {
        // Still pending approval, check details
        final String msg = response.data['message'] ?? 'Device status is PENDING';
        if (msg.contains('REVOKED')) {
          _pollingTimer?.cancel();
          setState(() {
            _error = 'Device pairing request has been revoked or denied by the administrator.';
          });
        }
      }
    } catch (e) {
      // Network drops are handled silently (keep polling)
      debugPrint('Polling error: $e');
    }
  }

  Future<void> _cancelPairing() async {
    _pollingTimer?.cancel();
    final secureStorage = ref.read(secureStorageProvider);
    final db = ref.read(databaseProvider);
    
    await secureStorage.clearAll();
    if (_deviceId != null) {
      db.deleteWorkstation(_deviceId!);
    }
    db.logEvent('Pairing Cancelled', 'Device pairing onboarding aborted by user');
    ref.read(authStateNotifierProvider.notifier).setStatus(MobileAuthStatus.unpaired);
    
    if (mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // Loading Glow effect
              Center(
                child: SizedBox(
                  height: 100,
                  width: 100,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(theme.primaryColor),
                        strokeWidth: 6,
                      ),
                      Icon(
                        Icons.hourglass_empty,
                        size: 36,
                        color: theme.primaryColor,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'Approval Pending',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 30),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                'AegisOS Workstation registry updated. Please approve this device inside the console Security Operations dashboard.',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              
              if (_deviceId != null) ...[
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    border: Border.all(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'DEVICE IDENTIFIER',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _deviceId!,
                        style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 24),
                Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ],

              const Spacer(),
              OutlinedButton.icon(
                onPressed: _cancelPairing,
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Cancel Pairing Request'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Colors.redAccent),
                  foregroundColor: Colors.redAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
