import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../../config/router.dart';

class PairingPage extends ConsumerStatefulWidget {
  const PairingPage({super.key});

  @override
  ConsumerState<PairingPage> createState() => _PairingPageState();
}

class _PairingPageState extends ConsumerState<PairingPage> {
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _simulateQrScan() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Mock QR contents scanned
      const mockQrData = 'wss://10.0.0.5:3000/api/v2/mobile?token=PAIR-998-121-AAA';
      final uri = Uri.parse(mockQrData);
      final pairingToken = uri.queryParameters['token'] ?? '';

      // 2. Generate key pair inside simulated Secure Enclave
      final deviceId = const Uuid().v4();
      const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...';

      // 3. Register with workstation API gateway
      await Future<void>.delayed(const Duration(seconds: 1)); // Network simulation

      if (!pairingToken.startsWith('PAIR-')) {
        throw Exception('Invalid pairing token. Please scan a fresh QR code.');
      }

      // Successful registration. Save details locally and redirect.
      ref.read(pairingStateProvider.notifier).state = true;
      ref.read(authStateProvider.notifier).state = true; // Auto-unlock on initial pair

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device paired and authenticated successfully!')),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Pair Device',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 32),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                'Scan the QR code displayed on the AegisOS Web Console to establish zero-trust certificate authentication.',
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton.icon(
                  onPressed: _simulateQrScan,
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Simulate Scan QR Code'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: theme.primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 24),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
