import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

final modelsFutureProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/mobile/infrastructure/models');
  if (response.statusCode == 200) {
    return Map<String, dynamic>.from(response.data);
  } else {
    throw Exception('Failed to load models status: ${response.statusCode}');
  }
});

class ModelsPage extends ConsumerWidget {
  const ModelsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final modelsAsync = ref.watch(modelsFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Models Monitor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(modelsFutureProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(modelsFutureProvider),
        child: modelsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  Text('Error loading models: $err', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(modelsFutureProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (data) {
            final activeModel = data['currentModel'] ?? {};
            final loadedModels = (data['loadedModels'] as List? ?? []);
            final vram = data['vramUsage'] ?? {};
            final inference = data['inference'] ?? {};

            final double vramTotalGb = (vram['totalBytes'] ?? 0) / (1024 * 1024 * 1024);
            final double vramUsedGb = (vram['usedBytes'] ?? 0) / (1024 * 1024 * 1024);
            final double vramFreeGb = (vram['freeBytes'] ?? 0) / (1024 * 1024 * 1024);
            final int vramPercent = vram['percent'] ?? 0;

            return ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // 1. Current Active Model
                Card(
                  color: theme.colorScheme.surface,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Active Model in VRAM',
                              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'ACTIVE',
                                style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          activeModel['displayName'] ?? 'Gemma 2 9B (Local)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ID: ${activeModel['id'] ?? ''}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'monospace'),
                        ),
                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildInfoColumn('Context Length', '${activeModel['contextLength'] ?? 8192} tokens'),
                            _buildInfoColumn('VRAM Target', '${activeModel['vramRequiredGb'] ?? 8} GB'),
                            _buildInfoColumn('Latency Avg', '250ms'),
                          ],
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 2. GPU VRAM Allocation Gauge
                Card(
                  color: theme.colorScheme.surface,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('VRAM Memory Mapping', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            SizedBox(
                              height: 64,
                              width: 64,
                              child: CircularProgressIndicator(
                                value: vramPercent / 100,
                                strokeWidth: 6,
                                backgroundColor: Colors.grey.withOpacity(0.1),
                                valueColor: const AlwaysStoppedAnimation<Color>(Colors.cyan),
                              ),
                            ),
                            const SizedBox(width: 24),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: ModelProviderType == 'ollama' ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${vramUsedGb.toStringAsFixed(1)} GB Used / ${vramTotalGb.toStringAsFixed(1)} GB Total',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Free space: ${vramFreeGb.toStringAsFixed(1)} GB (${100 - vramPercent}% free)',
                                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                                  ),
                                ],
                              ),
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 3. Inference Queue Stats Grid
                Text('Inference Statistics', style: theme.textTheme.titleMedium),
                const SizedBox(height: 10),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.6,
                  children: [
                    _buildStatCard(context, 'Inference Speed', '${inference['tokensPerSec']?.toStringAsFixed(1) ?? '32.5'} t/s', Icons.speed),
                    _buildStatCard(context, 'Pending Queue', '${inference['queueSize'] ?? 0} jobs', Icons.queue),
                    _buildStatCard(context, 'Running Agents', '${inference['runningAgents'] ?? 0} agents', Icons.smart_toy_outlined),
                    _buildStatCard(context, 'Failed Runs', '${inference['failedJobs'] ?? 0} errors', Icons.error_outline),
                  ],
                ),
                const SizedBox(height: 24),

                // 4. All Configured Models List
                Text('Registry Models', style: theme.textTheme.titleMedium),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    border: Border.all(color: theme.colorScheme.outline),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: loadedModels.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final m = loadedModels[index];
                      final isOnline = m['status'] == 'online';
                      return ListTile(
                        title: Text(m['displayName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text('${m['provider']} • ctx: ${m['contextLength']} • ${m['vramRequiredGb']}GB VRAM', style: const TextStyle(fontSize: 11)),
                        trailing: Container(
                          height: 8,
                          width: 8,
                          decoration: BoxDecoration(
                            color: isOnline ? Colors.green : Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, String label, String value, IconData icon) {
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: theme.primaryColor),
                const SizedBox(width: 6),
                Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
