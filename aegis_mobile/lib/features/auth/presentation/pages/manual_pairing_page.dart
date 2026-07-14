import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import 'auth_providers.dart';

class ManualPairingPage extends ConsumerStatefulWidget {
  const ManualPairingPage({super.key});

  @override
  ConsumerState<ManualPairingPage> createState() => _ManualPairingPageState();
}

class _ManualPairingPageState extends ConsumerState<ManualPairingPage> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController(text: 'http://localhost:3000/api/v1');
  final _codeController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _addressController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submitPairing() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final String address = _addressController.text.trim();
      final String code = _codeController.text.trim();

      final apiClient = ref.read(apiClientProvider);
      final db = ref.read(databaseProvider);
      final secureStorage = ref.read(secureStorageProvider);

      // Set base address dynamically
      apiClient.setBaseUrl(address);

      final deviceId = const Uuid().v4();
      const mockPrivateKey = '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgt1n7f...';
      const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9wQ8R1wM2H...';

      await secureStorage.savePrivateKey(mockPrivateKey);
      await secureStorage.savePublicKey(mockPublicKey);
      await secureStorage.saveDeviceId(deviceId);

      final dio = apiClient.dio;
      final response = await dio.post(
        '/mobile/auth/pair',
        data: {
          'pairingCode': code,
          'publicKey': mockPublicKey,
          'deviceName': 'Companion App Manual Client',
          'metadata': {
            'os': 'Android/iOS Simulator',
            'model': 'Aegis manual device',
            'deviceId': deviceId,
          }
        },
      );

      if (response.statusCode == 201) {
        final resData = response.data;
        final String status = resData['status'] ?? 'PENDING';

        db.saveWorkstation({
          'id': deviceId,
          'hostAddress': address,
          'hostName': 'Manual Workstation',
          'fingerprint': 'sha256-fingerprint-placeholder-aaaa-bbbb-cccc',
          'status': status,
          'pairedAt': DateTime.now().millisecondsSinceEpoch,
        });

        db.logEvent('Manual Onboarding Request Sent', 'Device pairing initialized via manual code');

        ref.read(authStateNotifierProvider.notifier).setStatus(MobileAuthStatus.pendingApproval);
        
        if (mounted) {
          context.go('/pending');
        }
      } else {
        throw Exception('Server rejected pairing. Status: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection failure: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual Pairing'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Enter Workstation Address',
                  style: theme.textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Type your workstation console server endpoint and manual pairing code to authenticate.',
                  style: theme.textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                
                // Address Field
                TextFormField(
                  controller: _addressController,
                  decoration: InputDecoration(
                    labelText: 'Workstation Address URL',
                    hintText: 'http://192.168.1.100:3000/api/v1',
                    prefixIcon: const Icon(Icons.dns_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Address URL is required';
                    }
                    if (!value.startsWith('http://') && !value.startsWith('https://')) {
                      return 'Must start with http:// or https://';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                
                // Code Field
                TextFormField(
                  controller: _codeController,
                  decoration: InputDecoration(
                    labelText: 'Pairing Code',
                    hintText: 'AEGIS-123-456',
                    prefixIcon: const Icon(Icons.lock_open_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Pairing code is required';
                    }
                    return null;
                  },
                ),
                
                const SizedBox(height: 32),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                
                ElevatedButton(
                  onPressed: _isLoading ? null : _submitPairing,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: theme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Establish Zero-Trust Pairing'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
