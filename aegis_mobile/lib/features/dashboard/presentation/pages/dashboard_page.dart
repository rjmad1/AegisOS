import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AegisOS Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_active),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No new push notifications.')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Workstation Proximity Status Banner
            Card(
              color: theme.colorScheme.surface,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: theme.colorScheme.outline),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Icon(Icons.wifi_tethering, color: Colors.green, size: 28),
                    SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Workstation Host: aegis-workstation-0', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Status: Connected via VPN', style: TextStyle(color: Colors.green)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Live Metrics Section
            Text('Resource Telemetry', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _buildMetricTile(context, 'CPU', '14.5%', Colors.purple)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricTile(context, 'GPU', '68.2%', Colors.indigo)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricTile(context, 'VRAM', '4.2 GB', Colors.cyan)),
              ],
            ),
            const SizedBox(height: 24),

            // Human-in-the-Loop Actions List
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Pending Approvals', style: theme.textTheme.titleMedium),
                const Chip(label: Text('1 Action Required'), backgroundColor: Colors.magenta, labelStyle: TextStyle(color: Colors.white, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 10),
            _buildApprovalCard(
              context,
              title: 'Workspace Clean',
              command: 'rm -rf node_modules',
              risk: 'High',
              onApprove: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Action approved and signed.')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(BuildContext context, String label, String value, Color accentColor) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: theme.colorScheme.outline),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(label, style: theme.textTheme.bodySmall),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(height: 4, width: 40, color: accentColor),
          ],
        ),
      ),
    );
  }

  Widget _buildApprovalCard(
    BuildContext context, {
    required String title,
    required String command,
    required String risk,
    required VoidCallback onApprove,
  }) {
    final theme = Theme.of(context);
    return Card(
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Risk: $risk',
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                command,
                style: const TextStyle(fontFamily: 'monospace', color: Colors.amber, fontSize: 14),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () {},
                  child: const Text('Reject', style: TextStyle(color: Colors.red)),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: onApprove,
                  style: ElevatedButton.styleFrom(backgroundColor: theme.primaryColor, foregroundColor: Colors.white),
                  child: const Text('Approve & Sign'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
