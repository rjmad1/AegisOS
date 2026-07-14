import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/telemetry_provider.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final telemetryState = ref.watch(telemetryProvider);
    final status = telemetryState.status;
    final data = telemetryState.data;

    // Resolve Connection Status pill
    Color statusColor;
    String statusText;
    switch (status) {
      case TelemetryConnectionStatus.connected:
        statusColor = Colors.green;
        statusText = 'Connected';
        break;
      case TelemetryConnectionStatus.connecting:
        statusColor = Colors.orange;
        statusText = 'Connecting';
        break;
      case TelemetryConnectionStatus.disconnected:
        statusColor = Colors.red;
        statusText = 'Disconnected';
        break;
    }

    final int healthScore = data?['healthScore'] ?? 100;
    Color healthColor = healthScore > 80
        ? Colors.green
        : healthScore > 50
            ? Colors.orange
            : Colors.red;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Executive Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(telemetryProvider.notifier).refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Connection Status Banner
              Card(
                color: theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Icon(Icons.sensors, color: statusColor, size: 28),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Workstation Host Link', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text(
                              statusText,
                              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      if (status == TelemetryConnectionStatus.disconnected)
                        IconButton(
                          icon: const Icon(Icons.refresh),
                          onPressed: () => ref.read(telemetryProvider.notifier).refresh(),
                        )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              if ((data?['pendingApprovals'] ?? 0) > 0) ...[
                Card(
                  color: Colors.orange.withOpacity(0.1),
                  shape: RoundedRectangleBorder(
                    side: const BorderSide(color: Colors.orange, width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.gavel_outlined, color: Colors.orange, size: 28),
                    title: const Text(
                      'HITL Action Pending',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      'There are ${data?['pendingApprovals']} commands waiting for cryptographic signature.',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: ElevatedButton(
                      onPressed: () => context.push('/commands'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: const Text('AUTHORIZE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 2. Health Score Gauge Card
              Card(
                color: theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [healthColor.withOpacity(0.05), Colors.transparent],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Text(
                        'Workstation Health Rating',
                        style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                      ),
                      const SizedBox(height: 12),
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            height: 120,
                            width: 120,
                            child: CircularProgressIndicator(
                              value: healthScore / 100,
                              strokeWidth: 8,
                              backgroundColor: Colors.grey.withOpacity(0.1),
                              valueColor: AlwaysStoppedAnimation<Color>(healthColor),
                            ),
                          ),
                          Column(
                            children: [
                              Text(
                                '$healthScore%',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: healthColor,
                                ),
                              ),
                              const Text(
                                'Stable',
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          )
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 3. Telemetry Tiles
              Text('Resource Status', style: theme.textTheme.titleMedium),
              const SizedBox(height: 10),
              LayoutBuilder(
                builder: (context, constraints) {
                  final bool isWide = constraints.maxWidth > 500;
                  final storagePercent = data?['disk']?['percent'] ?? 0;
                  final storageFreeGB = ((data?['disk']?['free'] ?? 0) / (1024 * 1024 * 1024)).toStringAsFixed(0);

                  final cpuTile = _buildMetricTile(
                    context,
                    'CPU',
                    '${data?['cpu']?['load'] ?? 0}%',
                    '${data?['cpu']?['temperature'] ?? 0}°C',
                    Colors.purple,
                  );

                  final memTile = _buildMetricTile(
                    context,
                    'Memory',
                    '${data?['memory']?['percent'] ?? 0}%',
                    '${((data?['memory']?['used'] ?? 0) / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB',
                    Colors.indigo,
                  );

                  final gpuTile = _buildMetricTile(
                    context,
                    'GPU',
                    '${data?['gpu']?['utilization'] ?? 0}%',
                    '${data?['gpu']?['temperature'] ?? 0}°C',
                    Colors.cyan,
                  );

                  final storageTile = _buildMetricTile(
                    context,
                    'Storage',
                    '$storagePercent%',
                    '$storageFreeGB GB Free',
                    Colors.deepPurple,
                  );

                  if (isWide) {
                    return Row(
                      children: [
                        Expanded(child: cpuTile),
                        const SizedBox(width: 10),
                        Expanded(child: memTile),
                        const SizedBox(width: 10),
                        Expanded(child: gpuTile),
                        const SizedBox(width: 10),
                        Expanded(child: storageTile),
                      ],
                    );
                  } else {
                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(child: cpuTile),
                            const SizedBox(width: 10),
                            Expanded(child: memTile),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: gpuTile),
                            const SizedBox(width: 10),
                            Expanded(child: storageTile),
                          ],
                        ),
                      ],
                    );
                  }
                },
              ),
              const SizedBox(height: 24),

              // AI Ops Status summary
              Text('AI Ops Runtime', style: theme.textTheme.titleMedium),
              const SizedBox(height: 10),
              Card(
                color: theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Active Model', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text(
                            data?['aiRuntime']?['currentModel'] ?? 'None',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueAccent),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Running Agents', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: (data?['aiRuntime']?['runningAgents'] ?? 0) > 0
                                  ? Colors.green.withOpacity(0.1)
                                  : Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${data?['aiRuntime']?['runningAgents'] ?? 0} active',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: (data?['aiRuntime']?['runningAgents'] ?? 0) > 0 ? Colors.green : Colors.grey,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Inference Queue', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text(
                            '${data?['aiRuntime']?['queuedJobs'] ?? 0} jobs queued',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Token Speed', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text(
                            '${(data?['aiRuntime']?['tokensPerSec'] ?? 0.0).toStringAsFixed(1)} T/s',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.purpleAccent),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // 4. Mission Control Navigation Panel
              Text('Command Centers', style: theme.textTheme.titleMedium),
              const SizedBox(height: 10),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _buildNavCard(
                    context,
                    title: 'Hardware Overview',
                    subtitle: 'Disk, Net, Temperature',
                    icon: Icons.developer_board_outlined,
                    route: '/infra',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Services Engine',
                    subtitle: 'Ollama, LiteLLM, DBs',
                    icon: Icons.settings_input_component_outlined,
                    route: '/services',
                  ),
                  _buildNavCard(
                    context,
                    title: 'AI Models Monitor',
                    subtitle: 'VRAM, Tokens/sec rate',
                    icon: Icons.model_training_outlined,
                    route: '/models',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Agent Registry',
                    subtitle: 'Active reasoning, tasks',
                    icon: Icons.psychology_outlined,
                    route: '/agents',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Command & Control',
                    subtitle: 'Secure execution bus',
                    icon: Icons.terminal_outlined,
                    route: '/commands',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Notifications',
                    subtitle: 'Alerts & events',
                    icon: Icons.notifications_active_outlined,
                    route: '/alerts',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Projects',
                    subtitle: 'Workstation projects',
                    icon: Icons.folder_outlined,
                    route: '/projects',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Upload Center',
                    subtitle: 'Send files to workstation',
                    icon: Icons.cloud_upload_outlined,
                    route: '/upload',
                  ),
                  _buildNavCard(
                    context,
                    title: 'Voice Feedback',
                    subtitle: 'Secure audio reports',
                    icon: Icons.mic_none_outlined,
                    route: '/feedback',
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // 5. Recent Alerts Summary
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Active Issues', style: theme.textTheme.titleMedium),
                  GestureDetector(
                    onTap: () => context.push('/alerts'),
                    child: Text(
                      'View All (${data?['alertsCount'] ?? 0})',
                      style: TextStyle(color: theme.primaryColor, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if ((data?['alertsCount'] ?? 0) == 0)
                Card(
                  color: theme.colorScheme.surface,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle, color: Colors.green, size: 20),
                        SizedBox(width: 8),
                        Text('All systems operating normally.', style: TextStyle(fontSize: 13, color: Colors.grey)),
                      ],
                    ),
                  ),
                )
              else
                Card(
                  color: Colors.red.withOpacity(0.05),
                  shape: RoundedRectangleBorder(
                    side: const BorderSide(color: Colors.redAccent),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.warning, color: Colors.redAccent),
                    title: const Text('Workstation Alert Triggered', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${data?['alertsCount']} critical threshold alerts require attention.', style: const TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/alerts'),
                  ),
                ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/assistant'),
        tooltip: 'Aegis AI Assistant',
        child: const Icon(Icons.chat_bubble_outline),
      ),
    );
  }

  Widget _buildMetricTile(BuildContext context, String label, String value, String subText, Color accentColor) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.surface,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: theme.colorScheme.outline),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(subText, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 8),
            Container(height: 3, width: 30, color: accentColor),
          ],
        ),
      ),
    );
  }

  Widget _buildNavCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required String route,
  }) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.surface,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: theme.colorScheme.outline),
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => context.push(route),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: theme.primaryColor, size: 24),
              const SizedBox(height: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(color: Colors.grey, fontSize: 10),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
