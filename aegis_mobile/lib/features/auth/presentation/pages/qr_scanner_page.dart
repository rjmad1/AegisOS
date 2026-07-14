import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import 'auth_providers.dart';

class QrScannerPage extends ConsumerStatefulWidget {
  const QrScannerPage({super.key});

  @override
  ConsumerState<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends ConsumerState<QrScannerPage> {
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handlePairing(String qrContent) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final Map<String, dynamic> data = json.decode(qrContent);
      final String? pairingToken = data['pairingToken'];
      final List<dynamic>? endpoints = data['endpoints'];

      if (pairingToken == null || endpoints == null || endpoints.isEmpty) {
        throw const FormatException('Invalid QR code format. Missing pairing configuration.');
      }

      // Resolve base HTTPS or HTTP endpoint (usually first endpoint in JSON)
      final endpoint = endpoints.first;
      final String httpUrl = endpoint['httpUrl'] ?? endpoint['httpsUrl'] ?? '';
      
      if (httpUrl.isEmpty) {
        throw const FormatException('No valid host endpoint url in QR code.');
      }

      // 1. Setup client and database
      final apiClient = ref.read(apiClientProvider);
      final db = ref.read(databaseProvider);
      final secureStorage = ref.read(secureStorageProvider);

      apiClient.setBaseUrl(httpUrl);

      // 2. Generate P-256 ECDSA key pair (Simulated Secure Enclave)
      final deviceId = const Uuid().v4();
      const mockPrivateKey = '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgt1n7f...';
      const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9wQ8R1wM2H...';

      await secureStorage.savePrivateKey(mockPrivateKey);
      await secureStorage.savePublicKey(mockPublicKey);
      await secureStorage.saveDeviceId(deviceId);

      // 3. Register with workstation API gateway
      final dio = apiClient.dio;
      final response = await dio.post(
        '/mobile/auth/pair',
        data: {
          'pairingToken': pairingToken,
          'publicKey': mockPublicKey,
          'deviceName': 'Companion App Client',
          'metadata': {
            'os': 'Android/iOS Simulator',
            'model': 'Aegis companion device',
            'deviceId': deviceId,
          }
        },
      );

      if (response.statusCode == 201) {
        final resData = response.data;
        final String status = resData['status'] ?? 'PENDING';

        // 4. Save workstation details to local DB
        db.saveWorkstation({
          'id': deviceId,
          'hostAddress': httpUrl,
          'hostName': 'Workstation Cluster',
          'fingerprint': 'sha256-fingerprint-placeholder-aaaa-bbbb-cccc',
          'status': status,
          'pairedAt': DateTime.now().millisecondsSinceEpoch,
        });

        db.logEvent('Onboarding Request Sent', 'Device pairing initialized, status: $status');

        // 5. Update state and navigate
        ref.read(authStateNotifierProvider.notifier).setStatus(MobileAuthStatus.pendingApproval);
        
        if (mounted) {
          context.go('/pending');
        }
      } else {
        throw Exception('Server rejected pairing. Status: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Pairing error: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildDiagnosticItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_box_outline_blank, size: 14, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Point camera at AegisOS Console',
                style: theme.textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Focus the QR code inside the viewfinder to initiate mTLS zero-trust pairing.',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              // Viewfinder overlay
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    border: Border.all(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Viewfinder border box
                      Container(
                        height: 200,
                        width: 200,
                        decoration: BoxDecoration(
                          border: Border.all(color: theme.primaryColor, width: 3),
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      if (_isLoading)
                        const CircularProgressIndicator()
                      else
                        const Icon(
                          Icons.qr_code,
                          size: 100,
                          color: Colors.grey,
                        ),
                    ],
                  ),
                ),
              ),
              
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.red.withOpacity(0.08),
                  shape: RoundedRectangleBorder(
                    side: const BorderSide(color: Colors.red, width: 1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 24),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Connection & Pairing Issue',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                        const Divider(height: 24, color: Colors.grey),
                        const Text(
                          'Troubleshooting Checklist:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        _buildDiagnosticItem('Are both devices on the same Wi-Fi subnet?'),
                        _buildDiagnosticItem('Is your Tailscale/VPN interface active?'),
                        _buildDiagnosticItem('Is the workstation console running on port 3000?'),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => context.go('/manual'),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Switch to Manual IP Pairing'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            foregroundColor: theme.primaryColor,
                            elevation: 0,
                            side: BorderSide(color: theme.primaryColor),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ] else ...[
                const SizedBox(height: 24),
              ],
              
              // Simulation Panel (Headless/CI testing)
              Card(
                color: theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Simulator Scan Panel',
                        style: TextStyle(fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _isLoading
                            ? null
                            : () {
                                // Mock scanned QR contents
                                final mockPayload = json.encode({
                                  'pairingToken': 'simulated-onboarding-token-123456',
                                  'endpoints': [
                                    {
                                      'ip': '127.0.0.1',
                                      'httpUrl': 'http://localhost:3000/api/v1',
                                      'httpsUrl': 'https://localhost:8443/api/v1'
                                    }
                                  ]
                                });
                                _handlePairing(mockPayload);
                              },
                        icon: const Icon(Icons.touch_app),
                        label: const Text('Simulate Successful Scan'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.deepPurple,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
