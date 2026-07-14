import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

final agentsFutureProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/mobile/infrastructure/agents');
  if (response.statusCode == 200) {
    final List<dynamic> data = response.data;
    return data.map((a) => Map<String, dynamic>.from(a)).toList();
  } else {
    throw Exception('Failed to load agents status: ${response.statusCode}');
  }
});

class AgentsPage extends ConsumerWidget {
  const AgentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final agentsAsync = ref.watch(agentsFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Registry'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(agentsFutureProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(agentsFutureProvider),
        child: agentsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  Text('Error loading agents: $err', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(agentsFutureProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (agents) => ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: agents.length,
            itemBuilder: (context, index) {
              final a = agents[index];
              final name = a['name'] ?? '';
              final role = a['role'] ?? '';
              final status = a['state'] ?? 'idle';
              final systemPrompt = a['systemPrompt'] ?? '';
              final metrics = a['metrics'] ?? {};
              final allowedModels = (a['allowedModels'] as List? ?? []);
              final allowedTools = (a['allowedTools'] as List? ?? []);

              final isBusy = status == 'busy' || status == 'thinking' || status == 'executing_tool';
              final Color statusColor = isBusy ? Colors.orange : Colors.grey;

              return Card(
                color: theme.colorScheme.surface,
                margin: const EdgeInsets.only(bottom: 16.0),
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
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('Role: $role • v${a['version']}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              status.toUpperCase(),
                              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Prompt Card
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          systemPrompt,
                          style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Metrics Table Grid
                      Row(
                        children: [
                          Expanded(child: _buildAgentMetric('Invocations', '${metrics['invocations'] ?? 0}')),
                          Expanded(child: _buildAgentMetric('Tokens Used', '${metrics['tokensConsumed'] ?? 0}')),
                          Expanded(child: _buildAgentMetric('Cost USD', '\$${(metrics['runningCostUsd'] ?? 0.0).toStringAsFixed(4)}')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(height: 1),
                      const SizedBox(height: 12),

                      // Models & Tools allowed
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Allowed Models', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  allowedModels.isEmpty ? 'None' : allowedModels.join('\n'),
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Allowed Tools', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  allowedTools.isEmpty ? 'None' : allowedTools.join('\n'),
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildAgentMetric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
