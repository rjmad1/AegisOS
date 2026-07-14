import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_providers.dart';

class DeviceSettingsPage extends ConsumerStatefulWidget {
  const DeviceSettingsPage({super.key});

  @override
  ConsumerState<DeviceSettingsPage> createState() => _DeviceSettingsPageState();
}

class _DeviceSettingsPageState extends ConsumerState<DeviceSettingsPage> {
  List<Map<String, dynamic>> _workstations = [];
  List<Map<String, dynamic>> _auditLogs = [];

  // Preference Settings States
  bool _vpnActive = true;
  bool _darkMode = true;
  String _preferredModel = 'ollama:gemma2:9b';
  bool _notifyCritical = true;
  bool _notifyApprovals = true;
  bool _notifyCompletions = true;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    final db = ref.read(databaseProvider);
    setState(() {
      _workstations = db.getWorkstations();
      _auditLogs = db.getAuditLogs();
    });
  }

  Future<void> _handleRevoke() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unpair Workstation?'),
        content: const Text(
          'This will securely delete all cryptographic keys, pinned certificates, and offline logs from this device. You will need to re-pair via the Web Console.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            child: const Text('Unpair & Wipe'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final authNotifier = ref.read(authStateNotifierProvider.notifier);
      await authNotifier.logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Settings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshData,
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Paired Workstation Section
            Text('Trusted Workstation', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            if (_workstations.isEmpty)
              Card(
                color: theme.colorScheme.surface,
                child: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text('No workstations paired.', textAlign: TextAlign.center),
                ),
              )
            else
              ..._workstations.map((w) => Card(
                    color: theme.colorScheme.surface,
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
                              Text(
                                w['hostName'],
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  w['status'],
                                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.link, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Text(w['hostAddress'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.fingerprint, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Text(
                                'Fingerprint: ${w['fingerprint'].slice(0, 15)}...',
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )),
            const SizedBox(height: 24),

            // Preference Settings Section
            Text('Preferences', style: theme.textTheme.titleMedium),
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
                    // VPN Tunnel Status Switch
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.vpn_lock, color: Colors.blueAccent, size: 22),
                            SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Tailscale VPN Link', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('Secure mesh loopback tunnel', style: TextStyle(color: Colors.grey, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        Switch(
                          value: _vpnActive,
                          activeColor: theme.primaryColor,
                          onChanged: (val) {
                            setState(() => _vpnActive = val);
                            final db = ref.read(databaseProvider);
                            db.logEvent('VPN Toggled', 'VPN tunnel simulated state set to: $val');
                            _refreshData();
                          },
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Preferred model context selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.model_training, color: Colors.purple, size: 22),
                            SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Default LLM model', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('Preferred workstation context', style: TextStyle(color: Colors.grey, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        SizedBox(
                          width: 130,
                          child: DropdownButton<String>(
                            value: _preferredModel,
                            isExpanded: true,
                            underline: const SizedBox(),
                            onChanged: (String? newValue) {
                              if (newValue != null) {
                                setState(() => _preferredModel = newValue);
                                final db = ref.read(databaseProvider);
                                db.logEvent('Model Preference Changed', 'Set default LLM model to: $newValue');
                                _refreshData();
                              }
                            },
                            items: const [
                              DropdownMenuItem(value: 'ollama:gemma2:9b', child: Text('Gemma 2 9B')),
                              DropdownMenuItem(value: 'ollama:llama3:8b', child: Text('Llama 3 8B')),
                              DropdownMenuItem(value: 'ollama:deepseek-coder', child: Text('Deepseek Coder')),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // App Theme Switch
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.dark_mode_outlined, color: Colors.amber, size: 22),
                            SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Dark Theme Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('Sleek graphite obsidian tone', style: TextStyle(color: Colors.grey, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        Switch(
                          value: _darkMode,
                          activeColor: theme.primaryColor,
                          onChanged: (val) {
                            setState(() => _darkMode = val);
                            final db = ref.read(databaseProvider);
                            db.logEvent('Theme Changed', 'Set dark mode to: $val');
                            _refreshData();
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Notification preferences Switches
            Text('Push Notifications', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            Card(
              color: theme.colorScheme.surface,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: theme.colorScheme.outline),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  children: [
                    SwitchListTile(
                      secondary: const Icon(Icons.error_outline, color: Colors.redAccent),
                      title: const Text('Critical Infrastructure', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Hardware alerts, high temperatures, service down', style: TextStyle(fontSize: 11)),
                      value: _notifyCritical,
                      activeColor: theme.primaryColor,
                      onChanged: (val) => setState(() => _notifyCritical = val),
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      secondary: const Icon(Icons.gavel, color: Colors.orange),
                      title: const Text('Human Approvals (HITL)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Sensitive tool triggers requiring cryptographic key signing', style: TextStyle(fontSize: 11)),
                      value: _notifyApprovals,
                      activeColor: theme.primaryColor,
                      onChanged: (val) => setState(() => _notifyApprovals = val),
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      secondary: const Icon(Icons.check_circle_outline, color: Colors.green),
                      title: const Text('Job Completions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Long-running tasks and agent mission reports', style: TextStyle(fontSize: 11)),
                      value: _notifyCompletions,
                      activeColor: theme.primaryColor,
                      onChanged: (val) => setState(() => _notifyCompletions = val),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Local Audit Logs Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Mobile Audit Ledger', style: theme.textTheme.titleMedium),
                Text('${_auditLogs.length} events', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border.all(color: theme.colorScheme.outline),
                borderRadius: BorderRadius.circular(12),
              ),
              child: _auditLogs.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No audit events recorded.', textAlign: TextAlign.center),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _auditLogs.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final log = _auditLogs[index];
                        final date = DateTime.fromMillisecondsSinceEpoch(log['timestamp']);
                        return ListTile(
                          title: Text(log['action'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          subtitle: Text(log['details'], style: const TextStyle(fontSize: 11)),
                          trailing: Text(
                            '${date.hour}:${date.minute.toString().padLeft(2, '0')}',
                            style: const TextStyle(color: Colors.grey, fontSize: 10),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 32),

            // Danger Zone Section
            Text('Danger Zone', style: theme.textTheme.titleMedium?.copyWith(color: Colors.redAccent)),
            const SizedBox(height: 10),
            Card(
              color: Colors.red.withOpacity(0.05),
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: Colors.redAccent),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Unpairing this device deletes all session keys and certificates. The workstation will no longer recognize this client for signing command line prompts.',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _handleRevoke,
                      icon: const Icon(Icons.link_off_outlined),
                      label: const Text('Revoke Trust & Unpair'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

extension StringSlice on String {
  String slice(int start, int end) {
    if (length < end) return this;
    return substring(start, end);
  }
}
