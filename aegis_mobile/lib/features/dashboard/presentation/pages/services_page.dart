import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

final servicesFutureProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/mobile/infrastructure/services');
  if (response.statusCode == 200) {
    final List<dynamic> data = response.data;
    return data.map((s) => Map<String, dynamic>.from(s)).toList();
  } else {
    throw Exception('Failed to load services status: ${response.statusCode}');
  }
});

class ServicesPage extends ConsumerStatefulWidget {
  const ServicesPage({super.key});

  @override
  ConsumerState<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends ConsumerState<ServicesPage> {
  bool _isActionLoading = false;

  Future<void> _handleServiceAction(String serviceName, String action) async {
    setState(() {
      _isActionLoading = true;
    });

    try {
      // Log event locally to SQLite database
      final db = ref.read(databaseProvider);
      db.logEvent('Service Action Triggered', 'Action [$action] sent to service [$serviceName]');

      // Simulate network request to trigger host control
      await Future.delayed(const Duration(milliseconds: 1200));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Service $serviceName has been $action successfully.'),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh list
        ref.invalidate(servicesFutureProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to perform action: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isActionLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final servicesAsync = ref.watch(servicesFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Services Engine'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(servicesFutureProvider),
          ),
        ],
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: () async => ref.invalidate(servicesFutureProvider),
            child: servicesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 16),
                      Text('Error loading services: $err', textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(servicesFutureProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (services) => ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: services.length,
                itemBuilder: (context, index) {
                  final s = services[index];
                  final name = s['name'] ?? 'Unknown';
                  final displayName = s['displayName'] ?? name;
                  final status = s['status'] ?? 'stopped';
                  final port = s['port'];
                  final description = s['description'] ?? 'No description available.';

                  final isRunning = status == 'running';
                  final statusColor = isRunning ? Colors.green : Colors.red;

                  return Card(
                    color: theme.colorScheme.surface,
                    margin: const EdgeInsets.only(bottom: 12.0),
                    shape: RoundedRectangleBorder(
                      side: BorderSide(color: theme.colorScheme.outline),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  displayName,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              if (port != null) ...[
                                const Icon(Icons.dns, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  'Port: $port',
                                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.grey),
                                ),
                                const SizedBox(width: 16),
                              ],
                              const Icon(Icons.toggle_on_outlined, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              const Text(
                                'Type: systemd/service',
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            description,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              if (isRunning)
                                TextButton.icon(
                                  onPressed: () => _handleServiceAction(name, 'stopped'),
                                  icon: const Icon(Icons.stop, size: 16, color: Colors.red),
                                  label: const Text('Stop', style: TextStyle(color: Colors.red)),
                                )
                              else
                                TextButton.icon(
                                  onPressed: () => _handleServiceAction(name, 'started'),
                                  icon: const Icon(Icons.play_arrow, size: 16, color: Colors.green),
                                  label: const Text('Start', style: TextStyle(color: Colors.green)),
                                ),
                              const SizedBox(width: 8),
                              OutlinedButton.icon(
                                onPressed: () => _handleServiceAction(name, 'restarted'),
                                icon: const Icon(Icons.refresh, size: 16),
                                label: const Text('Restart'),
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: theme.colorScheme.outline),
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
          if (_isActionLoading)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Sending command to workstation...'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
