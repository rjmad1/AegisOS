import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/commands_provider.dart';
import '../../../auth/presentation/pages/auth_providers.dart';

class ApprovalScreenPage extends ConsumerStatefulWidget {
  final String commandId;
  const ApprovalScreenPage({super.key, required this.commandId});

  @override
  ConsumerState<ApprovalScreenPage> createState() => _ApprovalScreenPageState();
}

class _ApprovalScreenPageState extends ConsumerState<ApprovalScreenPage> {
  double _sliderPosition = 0.0;
  final double _sliderWidth = 280.0;
  final double _thumbSize = 56.0;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(commandsProvider);
    final cmd = state.commands.firstWhere((c) => c.id == widget.commandId, orElse: () => null as dynamic);

    if (cmd == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Resolve Approval Gate')),
        body: const Center(child: Text('Loading command metadata...')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Operational Control Gate'),
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Header Alert Warning
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade300, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.orange.shade800, size: 36),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Human Approval Required',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 15),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'This action will modify running environment configurations on the host.',
                              style: TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Command description details
                const Text(
                  'COMMAND DETAILS',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          cmd.type,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        const SizedBox(height: 8),
                        Text('Risk Classification: ${cmd.riskLevel}', style: const TextStyle(color: Colors.grey)),
                        Text('Command Priority: ${cmd.priority}', style: const TextStyle(color: Colors.grey)),
                        const Divider(height: 24),
                        const Text('Payload Parameters:', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(
                          cmd.payload.toString(),
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.indigo),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                // Rejection Action
                OutlinedButton.icon(
                  onPressed: _isProcessing ? null : () => _resolveApproval(false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Colors.red),
                    foregroundColor: Colors.red,
                  ),
                  icon: const Icon(Icons.close),
                  label: const Text('REJECT COMMAND', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
                const SizedBox(height: 24),
                // Swipe Slider Track
                Center(
                  child: Container(
                    width: _sliderWidth,
                    height: _thumbSize,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(_thumbSize / 2),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Stack(
                      children: [
                        // Slider prompt text
                        Center(
                          child: Text(
                            'SLIDE TO APPROVE',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                        // Drag target thumb
                        Positioned(
                          left: _sliderPosition,
                          child: GestureDetector(
                            onHorizontalDragUpdate: _isProcessing ? null : (details) {
                              setState(() {
                                _sliderPosition += details.primaryDelta!;
                                if (_sliderPosition < 0) _sliderPosition = 0;
                                final maxPos = _sliderWidth - _thumbSize;
                                if (_sliderPosition > maxPos) _sliderPosition = maxPos;
                              });
                            },
                            onHorizontalDragEnd: _isProcessing ? null : (details) async {
                              final maxPos = _sliderWidth - _thumbSize;
                              if (_sliderPosition >= maxPos * 0.9) {
                                // Slide success! trigger verification
                                setState(() {
                                  _sliderPosition = maxPos;
                                });
                                await _resolveApproval(true);
                              } else {
                                // Reset position
                                setState(() {
                                  _sliderPosition = 0.0;
                                });
                              }
                            },
                            child: Container(
                              width: _thumbSize,
                              height: _thumbSize,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.green,
                              ),
                              child: const Icon(Icons.arrow_forward, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
          if (_isProcessing)
            const Container(
              color: Colors.black26,
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Future<void> _resolveApproval(bool approve) async {
    setState(() => _isProcessing = true);
    try {
      final biometricService = ref.read(biometricServiceProvider);
      final commandsNotifier = ref.read(commandsProvider.notifier);

      // Enforce biometric validation before approving command
      if (approve) {
        final authenticated = await biometricService.authenticate(
          reason: 'Biometric authorization is required to sign command release.',
        );
        if (!authenticated) {
          setState(() {
            _sliderPosition = 0.0;
            _isProcessing = false;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Biometric verification failed. Sign aborted.'), backgroundColor: Colors.red),
            );
          }
          return;
        }
      }

      final success = approve
          ? await commandsNotifier.approveCommand(widget.commandId)
          : await commandsNotifier.rejectCommand(widget.commandId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success
                ? (approve ? 'Command approved and signed.' : 'Command rejected successfully.')
                : 'Action failed.'),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
        if (success) {
          context.pop();
        } else {
          setState(() {
            _sliderPosition = 0.0;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
        setState(() {
          _sliderPosition = 0.0;
        });
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }
}
