import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

final eventsFutureProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/mobile/infrastructure/events');
  if (response.statusCode == 200) {
    final List<dynamic> data = response.data;
    return data.map((e) => Map<String, dynamic>.from(e)).toList();
  } else {
    throw Exception('Failed to load system events: ${response.statusCode}');
  }
});

class AlertsPage extends ConsumerWidget {
  const AlertsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final eventsAsync = ref.watch(eventsFutureProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('System Audit & Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(eventsFutureProvider),
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(eventsFutureProvider),
        child: eventsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  Text('Error loading timeline: $err', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(eventsFutureProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (events) {
            return ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: events.length == 0 ? 1 : events.length,
              itemBuilder: (context, index) {
                if (events.isEmpty) {
                  return Card(
                    color: theme.colorScheme.surface,
                    shape: RoundedRectangleBorder(
                      side: BorderSide(color: theme.colorScheme.outline),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Center(
                        child: Text(
                          'No recent system events logged.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    ),
                  );
                }

                final e = events[index];
                final id = e['id'] ?? '';
                final name = e['name'] ?? '';
                final timestamp = e['timestamp'] ?? '';
                final priority = e['priority'] ?? 'normal';
                final payload = e['payload'] ?? {};

                Color priorityColor;
                IconData priorityIcon;
                switch (priority) {
                  case 'critical':
                  case 'high':
                    priorityColor = Colors.red;
                    priorityIcon = Icons.error;
                    break;
                  case 'warning':
                    priorityColor = Colors.orange;
                    priorityIcon = Icons.warning;
                    break;
                  default:
                    priorityColor = Colors.green;
                    priorityIcon = Icons.info_outline;
                    break;
                }

                // Parse human date
                String timeText = '';
                try {
                  final parsedDate = DateTime.parse(timestamp);
                  final localDate = parsedDate.toLocal();
                  timeText = '${localDate.hour.toString().padLeft(2, '0')}:${localDate.minute.toString().padLeft(2, '0')}:${localDate.second.toString().padLeft(2, '0')}';
                } catch (_) {
                  timeText = timestamp;
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Timeline dot and line
                      Column(
                        children: [
                          Icon(priorityIcon, color: priorityColor, size: 20),
                          Container(
                            width: 2,
                            height: 64,
                            color: theme.colorScheme.outline,
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      // Card details
                      Expanded(
                        child: Card(
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
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                    ),
                                    Text(
                                      timeText,
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  payload.toString(),
                                  style: const TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'monospace'),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'ID: ${id.substring(0, 8)}...',
                                      style: const TextStyle(fontSize: 9, color: Colors.grey),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: priorityColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        priority.toString().toUpperCase(),
                                        style: TextStyle(color: priorityColor, fontWeight: FontWeight.bold, fontSize: 8),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
