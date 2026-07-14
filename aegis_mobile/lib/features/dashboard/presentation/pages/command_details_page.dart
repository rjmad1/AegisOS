import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/commands_provider.dart';

class CommandDetailsPage extends ConsumerStatefulWidget {
  final String commandId;
  const CommandDetailsPage({super.key, required this.commandId});

  @override
  ConsumerState<CommandDetailsPage> createState() => _CommandDetailsPageState();
}

class _CommandDetailsPageState extends ConsumerState<CommandDetailsPage> {
  bool _isActionLoading = false;

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

  Widget _buildTimelineStep({
    required String title,
    required String subtitle,
    required bool isCompleted,
    required bool isFailed,
    required IconData icon,
    required Color color,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted
                    ? color.withOpacity(0.12)
                    : Colors.grey.shade100,
                border: Border.all(
                  color: isCompleted ? color : Colors.grey.shade300,
                  width: 2,
                ),
              ),
              child: Icon(
                icon,
                size: 16,
                color: isCompleted ? color : Colors.grey.shade400,
              ),
            ),
            Container(
              width: 2,
              height: 40,
              color: isCompleted ? color : Colors.grey.shade300,
            ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isFailed ? Colors.red : (isCompleted ? Colors.black87 : Colors.grey),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildExecutionTimeline(Command cmd) {
    final status = cmd.status.toUpperCase();
    final isSubmitted = true;
    final isApproved = cmd.approvalStatus == 'APPROVED' || cmd.approvalStatus == 'BYPASSED' || cmd.approvalStatus == 'AUTO';
    final isRunning = status == 'RUNNING' || status == 'COMPLETED' || status == 'FAILED' || status == 'ROLLED_BACK';
    final isFinished = status == 'COMPLETED' || status == 'FAILED' || status == 'ROLLED_BACK' || status == 'CANCELLED';
    final isFailed = status == 'FAILED' || cmd.approvalStatus == 'REJECTED' || status == 'CANCELLED';

    String approvalText = 'Status: ${cmd.approvalStatus} (Strategy: ${cmd.approvalType})';
    if (cmd.approvers.isNotEmpty) {
      approvalText += '\nApprovers: ' + cmd.approvers.map((a) => a['userEmail']).join(', ');
    }

    String resultText = 'Pending completion...';
    if (status == 'COMPLETED') {
      resultText = 'Success. Duration: ${cmd.durationMs ?? 0}ms';
    } else if (status == 'ROLLED_BACK') {
      resultText = 'Rolled back.';
    } else if (status == 'FAILED') {
      resultText = 'Failed: ${cmd.errorMessage ?? "Unknown error"}';
    } else if (status == 'CANCELLED') {
      resultText = 'Cancelled by administrator.';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Execution Timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 16),
        _buildTimelineStep(
          title: 'Submitted',
          subtitle: 'Timestamp: ${cmd.createdAt}',
          isCompleted: isSubmitted,
          isFailed: false,
          icon: Icons.check,
          color: Colors.green,
        ),
        _buildTimelineStep(
          title: 'Policy & Approval Engine Gate',
          subtitle: approvalText,
          isCompleted: isApproved || cmd.approvalStatus == 'REJECTED',
          isFailed: cmd.approvalStatus == 'REJECTED',
          icon: cmd.approvalStatus == 'REJECTED' ? Icons.close : Icons.policy_outlined,
          color: cmd.approvalStatus == 'REJECTED' ? Colors.red : Colors.green,
        ),
        _buildTimelineStep(
          title: 'Execution Engine Workers',
          subtitle: status == 'RUNNING' ? 'Running task execution...' : (isRunning ? 'Dispatched to workers.' : 'Awaiting worker thread...'),
          isCompleted: isRunning,
          isFailed: false,
          icon: Icons.settings_applications_outlined,
          color: Colors.blue,
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isFinished
                    ? (isFailed ? Colors.red.withOpacity(0.12) : Colors.green.withOpacity(0.12))
                    : Colors.grey.shade100,
                border: Border.all(
                  color: isFinished ? (isFailed ? Colors.red : Colors.green) : Colors.grey.shade300,
                  width: 2,
                ),
              ),
              child: Icon(
                isFailed ? Icons.error_outline : Icons.done_all,
                size: 16,
                color: isFinished ? (isFailed ? Colors.red : Colors.green) : Colors.grey.shade400,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 4.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isFailed ? 'Failed / Cancelled' : 'Completed Successfully',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isFinished ? (isFailed ? Colors.red : Colors.green) : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      resultText,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _handleAction(Future<bool> Function() actionFn, String successMsg) async {
    setState(() => _isActionLoading = true);
    try {
      final success = await actionFn();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success ? successMsg : 'Action failed.'),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
        if (success) {
          ref.read(commandsProvider.notifier).fetchCommands();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(commandsProvider);
    final cmd = state.commands.firstWhere((c) => c.id == widget.commandId, orElse: () => null as dynamic);

    if (cmd == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Command Details')),
        body: const Center(child: Text('Command details not found or loading...')),
      );
    }

    final riskColor = _getRiskColor(cmd.riskLevel);
    final statusColor = _getStatusColor(cmd.status);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Command Specification'),
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary card
              Card(
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
                              cmd.type,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: statusColor),
                            ),
                            child: Text(cmd.status, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Command ID: ${cmd.id}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                            decoration: BoxDecoration(color: riskColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text('RISK: ${cmd.riskLevel}', style: TextStyle(color: riskColor, fontWeight: FontWeight.bold, fontSize: 10)),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                            child: Text('PRIORITY: ${cmd.priority}', style: TextStyle(color: Colors.grey.shade800, fontWeight: FontWeight.bold, fontSize: 10)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Payload Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Payload Parameters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade900,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        width: double.infinity,
                        child: Text(
                          const JsonEncoder.withIndent('  ').convert(cmd.payload),
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            color: Colors.greenAccent,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Outcome results if completed
              if (cmd.result != null) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Execution Output', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          width: double.infinity,
                          child: Text(
                            const JsonEncoder.withIndent('  ').convert(cmd.result),
                            style: TextStyle(
                              fontFamily: 'monospace',
                              color: Colors.grey.shade800,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              // Timeline card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: _buildExecutionTimeline(cmd),
                ),
              ),
              const SizedBox(height: 32),
              // Operational actions
              if (cmd.status == 'PENDING_APPROVAL') ...[
                ElevatedButton.icon(
                  onPressed: () => context.push('/commands/${cmd.id}/approve'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.security),
                  label: const Text('Resolve Approval Gate', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
              ],
              if (cmd.status == 'PENDING_APPROVAL' || cmd.status == 'QUEUED') ...[
                OutlinedButton.icon(
                  onPressed: () => _handleAction(
                    () => ref.read(commandsProvider.notifier).cancelCommand(cmd.id),
                    'Command cancelled successfully.',
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Colors.purple),
                    foregroundColor: Colors.purple,
                  ),
                  icon: const Icon(Icons.cancel_outlined),
                  label: const Text('Cancel Command Execution', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
              ],
              if (cmd.status == 'COMPLETED' && cmd.rollbackPayload != null) ...[
                ElevatedButton.icon(
                  onPressed: () => _handleAction(
                    () => ref.read(commandsProvider.notifier).rollbackCommand(cmd.id),
                    'Rollback triggered successfully.',
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.red.shade700,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.history_outlined),
                  label: const Text('Trigger Programmatic Rollback', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
              ],
              if (cmd.status == 'ROLLED_BACK' && cmd.rollbackResult != null) ...[
                Card(
                  color: Colors.teal.shade50,
                  borderOnForeground: true,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.teal.shade700),
                            const SizedBox(width: 8),
                            Text(
                              'Rollback Success',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal.shade800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Outcome: ${const JsonEncoder().convert(cmd.rollbackResult)}',
                          style: TextStyle(color: Colors.teal.shade950, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (_isActionLoading)
            const Container(
              color: Colors.black26,
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
