import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/commands_provider.dart';

class CommandCenterPage extends ConsumerStatefulWidget {
  const CommandCenterPage({super.key});

  @override
  ConsumerState<CommandCenterPage> createState() => _CommandCenterPageState();
}

class _CommandCenterPageState extends ConsumerState<CommandCenterPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'all';

  final List<String> _categories = ['all', 'infrastructure', 'ai', 'agent', 'operations', 'diagnostics', 'system'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Color _getRiskColor(String risk) {
    switch (risk.toUpperCase()) {
      case 'LOW':
        return Colors.green;
      case 'MEDIUM':
        return Colors.blue;
      case 'HIGH':
        return Colors.orange;
      case 'CRITICAL':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'QUEUED':
        return Colors.amber;
      case 'PENDING_APPROVAL':
        return Colors.orange;
      case 'RUNNING':
        return Colors.blue;
      case 'COMPLETED':
        return Colors.green;
      case 'FAILED':
        return Colors.red;
      case 'CANCELLED':
        return Colors.purple;
      case 'ROLLED_BACK':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  Widget _buildCategoryFilters() {
    return Container(
      height: 48,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ChoiceChip(
              label: Text(
                cat.toUpperCase(),
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
              ),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _selectedCategory = cat;
                  });
                }
              },
              selectedColor: Theme.of(context).colorScheme.primaryContainer,
              labelStyle: TextStyle(
                color: isSelected
                    ? Theme.of(context).colorScheme.onPrimaryContainer
                    : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          );
        },
      ),
    );
  }

  List<Command> _filterCommands(List<Command> list, List<String> statuses) {
    return list.where((cmd) {
      final matchesStatus = statuses.contains(cmd.status.toUpperCase());
      
      final matchesCategory = _selectedCategory == 'all' || 
          cmd.type.startsWith('${_selectedCategory}:');

      final query = _searchController.text.toLowerCase();
      final matchesSearch = query.isEmpty ||
          cmd.id.toLowerCase().contains(query) ||
          cmd.type.toLowerCase().contains(query) ||
          cmd.payload.toString().toLowerCase().contains(query);

      return matchesStatus && matchesCategory && matchesSearch;
    }).toList();
  }

  Widget _buildCommandList(List<Command> list) {
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.dashboard_customize_outlined, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              const Text('No commands match filters', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: list.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (context, index) {
        final cmd = list[index];
        final riskColor = _getRiskColor(cmd.riskLevel);
        final statusColor = _getStatusColor(cmd.status);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => context.push('/commands/${cmd.id}'),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Shortened ID + Type
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cmd.type,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'ID: ${cmd.id.substring(0, 8)}...',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      // Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: statusColor, width: 1.5),
                        ),
                        child: Text(
                          cmd.status,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Details Row
                  Row(
                    children: [
                      // Risk Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                        decoration: BoxDecoration(
                          color: riskColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'RISK: ${cmd.riskLevel}',
                          style: TextStyle(color: riskColor, fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Priority Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'PRIORITY: ${cmd.priority}',
                          style: TextStyle(color: Colors.grey.shade800, fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ),
                      const Spacer(),
                      // Timestamp
                      Text(
                        cmd.createdAt.length > 19 
                            ? '${cmd.createdAt.substring(11, 19)}' 
                            : cmd.createdAt,
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showNewCommandSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24,
            left: 24,
            right: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Dispatch Command', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const Divider(),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.settings, color: Colors.blue),
                title: const Text('Restart AI Services'),
                subtitle: const Text('Medium Risk | Restart LiteLLM, Ollama, and routing proxies'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'operations:restart_ai_services',
                    {},
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.smart_toy_outlined, color: Colors.purple),
                title: const Text('Load Gemma 2 9B Model'),
                subtitle: const Text('Low Risk | Loads GGUF weights into VRAM'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'ai:load_model',
                    {'modelId': 'ollama:gemma2:9b'},
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.sync, color: Colors.green),
                title: const Text('Sync Knowledge Base'),
                subtitle: const Text('Low Risk | Synchronize and refresh knowledge sources'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'operations:sync_knowledge',
                    {},
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.health_and_safety_outlined, color: Colors.teal),
                title: const Text('Run Health Diagnostics'),
                subtitle: const Text('Low Risk | Full system health check and report'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'diagnostics:health_check',
                    {},
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.backup_outlined, color: Colors.indigo),
                title: const Text('Backup Workstation Database'),
                subtitle: const Text('Medium Risk | Saves databases state'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'system:backup',
                    {},
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.replay_outlined, color: Colors.orange),
                title: const Text('Retry Failed Jobs'),
                subtitle: const Text('Low Risk | Retry all recently failed jobs'),
                onTap: () async {
                  Navigator.pop(context);
                  await _triggerCommand(
                    'operations:retry_failed',
                    {},
                  );
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Future<void> _triggerCommand(String type, Map<String, dynamic> payload) async {
    final notifier = ref.read(commandsProvider.notifier);
    final success = await notifier.submitCommand(type: type, payload: payload);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Command dispatched successfully!' : 'Command submission failed.'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(commandsProvider);

    final pending = _filterCommands(state.commands, ['PENDING_APPROVAL']);
    final running = _filterCommands(state.commands, ['QUEUED', 'RUNNING']);
    final completed = _filterCommands(state.commands, ['COMPLETED', 'ROLLED_BACK']);
    final failed = _filterCommands(state.commands, ['FAILED', 'CANCELLED']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Command Center'),
        actions: [
          IconButton(
            icon: Icon(
              state.isWsConnected ? Icons.cloud_done : Icons.cloud_off,
              color: state.isWsConnected ? Colors.green : Colors.red,
            ),
            onPressed: () => ref.read(commandsProvider.notifier).connectWebSocket(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: SearchBar(
              controller: _searchController,
              hintText: 'Search command type, payload or ID...',
              leading: const Icon(Icons.search),
              onChanged: (_) => setState(() {}),
              elevation: WidgetStateProperty.all(1.0),
              padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 12)),
            ),
          ),
          // Category filter list
          _buildCategoryFilters(),
          // Tab bar selection
          TabBar(
            controller: _tabController,
            tabs: [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Pending'),
                    if (pending.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Badge(label: Text('${pending.length}')),
                    ]
                  ],
                ),
              ),
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Active'),
                    if (running.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Badge(label: Text('${running.length}')),
                    ]
                  ],
                ),
              ),
              const Tab(text: 'Completed'),
              const Tab(text: 'Failed'),
            ],
          ),
          // List content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildCommandList(pending),
                _buildCommandList(running),
                _buildCommandList(completed),
                _buildCommandList(failed),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showNewCommandSheet,
        child: const Icon(Icons.add),
      ),
    );
  }
}
