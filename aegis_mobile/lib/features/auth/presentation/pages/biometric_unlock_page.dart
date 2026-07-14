import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

class BiometricUnlockPage extends ConsumerStatefulWidget {
  const BiometricUnlockPage({super.key});

  @override
  ConsumerState<BiometricUnlockPage> createState() => _BiometricUnlockPageState();
}

class _BiometricUnlockPageState extends ConsumerState<BiometricUnlockPage> {
  bool _isAuthenticating = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Auto-trigger biometrics on page load after rendering completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _triggerBiometrics();
    });
  }

  Future<void> _triggerBiometrics() async {
    if (_isAuthenticating) return;
    
    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    final bioService = ref.read(biometricServiceProvider);
    final isSuccess = await bioService.authenticate(
      reason: 'Authenticate to access AegisOS Secure Console',
    );

    if (mounted) {
      setState(() {
        _isAuthenticating = false;
      });
    }

    if (isSuccess) {
      final db = ref.read(databaseProvider);
      db.logEvent('Biometric Unlock', 'Companion app unlocked successfully via biometrics');
      await ref.read(authStateNotifierProvider.notifier).unlock();
    } else {
      setState(() {
        _errorMessage = 'Biometric check failed. Tap lock to retry or use device passcode.';
      });
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
              // Shield padlock illustration
              Center(
                child: GestureDetector(
                  onTap: _triggerBiometrics,
                  child: Container(
                    height: 110,
                    width: 110,
                    decoration: BoxDecoration(
                      color: theme.primaryColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: theme.primaryColor.withOpacity(0.3), width: 2),
                    ),
                    child: Icon(
                      Icons.lock_outline_rounded,
                      size: 54,
                      color: theme.primaryColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Console Locked',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 32),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Biometric authorization is required to access local workstation panels and sign commands.',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              if (_errorMessage != null)
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _triggerBiometrics,
                icon: const Icon(Icons.fingerprint),
                label: const Text('Unlock Console Panel'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: theme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  // Simulate system passcode fallback
                  ref.read(databaseProvider).logEvent('Passcode Unlock', 'App unlocked via passcode fallback');
                  ref.read(authStateNotifierProvider.notifier).unlock();
                },
                child: const Text('Use Device Passcode Fallback', style: TextStyle(color: Colors.grey)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
