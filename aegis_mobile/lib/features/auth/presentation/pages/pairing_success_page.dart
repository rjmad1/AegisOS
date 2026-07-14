import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PairingSuccessPage extends StatelessWidget {
  const PairingSuccessPage({super.key});

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
              // Animated check icon container
              Center(
                child: Container(
                  height: 100,
                  width: 100,
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.green.withOpacity(0.4), width: 3),
                  ),
                  child: const Icon(
                    Icons.check_circle_outline_rounded,
                    size: 64,
                    color: Colors.green,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Trust Established!',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 32),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Zero-Trust Pairing Completed Successfully.',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),

              // Security Checklist
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  border: Border.all(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _buildChecklistItem(context, 'Secure Enclave P-256 Keypair', 'Active & Hardware Bound'),
                    const Divider(height: 24, color: Colors.grey),
                    _buildChecklistItem(context, 'Workstation Certificate Pinning', 'CA Trust Root Pinned'),
                    const Divider(height: 24, color: Colors.grey),
                    _buildChecklistItem(context, 'Encrypted SQLite Persistence', 'SQLCipher AES-256 Active'),
                  ],
                ),
              ),

              const Spacer(),
              ElevatedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.dashboard_customize_outlined),
                label: const Text('Go to Console Dashboard'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: theme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChecklistItem(BuildContext context, String title, String value) {
    return Row(
      children: [
        const Icon(Icons.verified, color: Colors.green, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }
}
