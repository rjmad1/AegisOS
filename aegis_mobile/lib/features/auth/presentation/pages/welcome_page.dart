import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // Icon Logo Shield
              Center(
                child: Container(
                  height: 96,
                  width: 96,
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withOpacity(0.1),
                    border: Border.all(color: theme.primaryColor.withOpacity(0.3), width: 2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(
                    Icons.shield_outlined,
                    size: 48,
                    color: theme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'AegisOS Mobile',
                style: theme.textTheme.displayLarge?.copyWith(fontSize: 32),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Zero-Trust workstation administration and cryptographic authorization gateway.',
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () => context.push('/scan'),
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Workstation QR Code'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: theme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => context.push('/manual'),
                icon: const Icon(Icons.edit_note),
                label: const Text('Manual Pairing Code Fallback'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: BorderSide(color: theme.colorScheme.outline),
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
}
