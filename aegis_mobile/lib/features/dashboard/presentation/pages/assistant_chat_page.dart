import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/assistant_provider.dart';
import '../../../auth/presentation/pages/auth_providers.dart';

class AssistantChatPage extends ConsumerStatefulWidget {
  const AssistantChatPage({super.key});

  @override
  ConsumerState<AssistantChatPage> createState() => _AssistantChatPageState();
}

class _AssistantChatPageState extends ConsumerState<AssistantChatPage> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isVoiceRecording = false;

  final List<String> _quickCommands = [
    "Restart Ollama",
    "Show GPU usage",
    "Stop Redis",
    "Pause all agents",
    "Reindex knowledge",
    "Backup the workstation",
    "Explain why memory usage is high"
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend(String text) async {
    if (text.trim().isEmpty) return;
    _textController.clear();
    await ref.read(assistantProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  void _showVoiceInputDemo() {
    setState(() => _isVoiceRecording = true);
    
    // Simulate speech recognition
    Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isVoiceRecording = false);
        _textController.text = "Restart Ollama";
      }
    });
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

  Color _getStepStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return Colors.green;
      case 'RUNNING':
        return Colors.blue;
      case 'FAILED':
        return Colors.red;
      case 'CANCELLED':
        return Colors.purple;
      default:
        return Colors.grey.shade400;
    }
  }

  Widget _buildStepTile(PlanStep step) {
    final statusColor = _getStepStatusColor(step.status);
    Widget icon = const Icon(Icons.circle_outlined, size: 16, color: Colors.grey);

    if (step.status == 'COMPLETED') {
      icon = const Icon(Icons.check_circle, size: 18, color: Colors.green);
    } else if (step.status == 'RUNNING') {
      icon = const SizedBox(
        width: 14,
        height: 14,
        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.blue)),
      );
    } else if (step.status == 'FAILED') {
      icon = const Icon(Icons.error, size: 18, color: Colors.red);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          icon,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.description,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                ),
                Text(
                  '${step.commandType} • ${step.estimatedDurationMs}ms',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, py: 2),
            decoration: BoxDecoration(
              color: _getRiskColor(step.riskLevel).withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              step.riskLevel,
              style: TextStyle(color: _getRiskColor(step.riskLevel), fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(AssistantMessage msg) {
    final plan = msg.plan!;
    final isExecuted = msg.commandIds != null && msg.commandIds!.isNotEmpty;
    final riskColor = _getRiskColor(plan.overallRisk);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Execution Preview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, py: 3),
                  decoration: BoxDecoration(color: riskColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                  child: Text('RISK: ${plan.overallRisk}', style: TextStyle(color: riskColor, fontWeight: FontWeight.bold, fontSize: 10)),
                ),
              ],
            ),
            const Divider(height: 20),
            ...plan.steps.map((s) => _buildStepTile(s)),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Est. Duration: ${plan.totalDurationMs}ms', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text(
                  plan.approvalRequired ? 'Requires Approval' : 'Auto-Approved',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: plan.approvalRequired ? Colors.orange : Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (!isExecuted) ...[
              ElevatedButton.icon(
                onPressed: () async {
                  if (plan.approvalRequired) {
                    // Navigate to approve confirmation flow
                    context.push('/commands/pending_chat_approve', extra: msg.id);
                  } else {
                    // Execute immediately
                    final ok = await ref.read(assistantProvider.notifier).executePlan(msg.id);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(ok ? 'Plan dispatched successfully.' : 'Plan execution failed.'),
                          backgroundColor: ok ? Colors.green : Colors.red,
                        ),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: plan.approvalRequired ? Colors.orange : Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.play_arrow),
                label: Text(plan.approvalRequired ? 'AUTHORIZE EXECUTION' : 'EXECUTE NOW'),
              ),
            ] else ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.sync_alt, color: Colors.blue, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'PLAN EXECUTING...',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade700, fontSize: 13),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(AssistantMessage msg) {
    final isUser = msg.role == 'user';
    final theme = Theme.of(context);

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, py: 12),
              decoration: BoxDecoration(
                color: isUser 
                    ? theme.colorScheme.primaryContainer 
                    : theme.colorScheme.surfaceVariant.withOpacity(0.5),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
                  bottomRight: isUser ? Radius.zero : const Radius.circular(16),
                ),
                border: isUser ? null : Border.all(color: Colors.grey.shade200),
              ),
              child: Text(
                msg.content,
                style: TextStyle(
                  color: isUser 
                      ? theme.colorScheme.onPrimaryContainer 
                      : theme.colorScheme.onSurfaceVariant,
                  fontSize: 14,
                ),
              ),
            ),
            if (msg.plan != null) _buildPlanCard(msg),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(assistantProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Aegis AI Assistant'),
        actions: [
          IconButton(
            icon: Icon(
              state.isWsConnected ? Icons.offline_bolt : Icons.offline_bolt_outlined,
              color: state.isWsConnected ? Colors.green : Colors.red,
            ),
            onPressed: () => ref.read(assistantProvider.notifier).connectWebSocket(),
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: () => ref.read(assistantProvider.notifier).clearChat(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat thread list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemCount: state.messages.length,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemBuilder: (context, index) {
                return _buildMessageBubble(state.messages[index]);
              },
            ),
          ),
          // Suggested action quick chips (only show if chat has few messages)
          if (state.messages.length < 5)
            Container(
              height: 40,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _quickCommands.length,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemBuilder: (context, index) {
                  final text = _quickCommands[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ActionChip(
                      label: Text(text, style: const TextStyle(fontSize: 12)),
                      onPressed: () => _handleSend(text),
                      backgroundColor: Colors.grey.shade50,
                    ),
                  );
                },
              ),
            ),
          // Processing loading indicator
          if (state.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8.0),
              child: LinearProgressIndicator(),
            ),
          // Input block
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
                color: Theme.of(context).colorScheme.surface,
              ),
              child: Row(
                children: [
                  // Voice recording button
                  IconButton(
                    icon: Icon(
                      _isVoiceRecording ? Icons.mic : Icons.mic_none,
                      color: _isVoiceRecording ? Colors.red : Colors.grey,
                    ),
                    onPressed: _showVoiceInputDemo,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Ask the assistant to perform operations...',
                        border: InputBorder.none,
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: _handleSend,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.send, color: Theme.of(context).colorScheme.primary),
                    onPressed: () => _handleSend(_textController.text),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
