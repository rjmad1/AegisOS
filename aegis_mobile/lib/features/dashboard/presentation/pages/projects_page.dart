import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Active project context provider
final selectedProjectProvider = StateProvider<String>((ref) => 'AegisOS Core');

/// Projects Page — Stub (V1.0)
///
/// Displays existing workstation projects. Selecting a project changes
/// the active context. No project indexing. No local storage.
class ProjectsPage extends ConsumerWidget {
  const ProjectsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final activeProject = ref.watch(selectedProjectProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Refreshing projects from workstation...')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search projects...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: theme.colorScheme.surface,
              ),
            ),
          ),

          // Project List
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: theme.primaryColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Active Workspace Context: $activeProject',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: theme.primaryColor,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Workstation Projects',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Selectable project cards
                  _buildSelectableCard(
                    context,
                    ref,
                    name: 'AegisOS Core',
                    subtitle: 'Local-First Orchestrator Gateway Platform',
                    isActive: activeProject == 'AegisOS Core',
                  ),
                  const SizedBox(height: 12),
                  _buildSelectableCard(
                    context,
                    ref,
                    name: 'Research Pipeline',
                    subtitle: 'Multimodal Agents Execution Pipeline',
                    isActive: activeProject == 'Research Pipeline',
                  ),
                  const SizedBox(height: 12),
                  _buildSelectableCard(
                    context,
                    ref,
                    name: 'Documentation',
                    subtitle: 'Technical Specs and PRD Assets',
                    isActive: activeProject == 'Documentation',
                  ),
                  const SizedBox(height: 32),

                  // Footer info
                  Center(
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock_clock_outlined, size: 16, color: theme.primaryColor),
                              const SizedBox(width: 8),
                              Text(
                                'Sync & Indexing: Next iteration',
                                style: TextStyle(
                                  color: theme.primaryColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Project indexing, schema mapping, and files sync occurs on the workstation.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectableCard(
    BuildContext context,
    WidgetRef ref, {
    required String name,
    required String subtitle,
    required bool isActive,
  }) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.surface,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: BorderSide(
          color: isActive ? theme.primaryColor : theme.colorScheme.outline.withOpacity(0.3),
          width: isActive ? 2.0 : 1.0,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          ref.read(selectedProjectProvider.notifier).state = name;
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Active workstation context set to: $name'),
              backgroundColor: theme.primaryColor,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isActive ? theme.primaryColor.withOpacity(0.1) : theme.colorScheme.outline.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.folder_outlined,
                  color: isActive ? theme.primaryColor : Colors.grey,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: isActive ? theme.primaryColor : theme.textTheme.bodyLarge?.color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (isActive)
                Icon(Icons.check_circle, color: theme.primaryColor, size: 24)
              else
                Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
