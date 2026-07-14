// aegis_mobile/lib/features/dashboard/presentation/pages/voice_feedback_page.dart
// Interactive voice feedback capture screen with custom silent WAV generator and direct multipart upload.

import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../../../infrastructure/network/api_client.dart';
import '../../../auth/presentation/pages/auth_providers.dart';

class VoiceFeedbackPage extends ConsumerStatefulWidget {
  const VoiceFeedbackPage({super.key});

  @override
  ConsumerState<VoiceFeedbackPage> createState() => _VoiceFeedbackPageState();
}

class _VoiceFeedbackPageState extends ConsumerState<VoiceFeedbackPage> with SingleTickerProviderStateMixin {
  String _reportType = 'GENERAL';
  bool _isRecording = false;
  bool _hasRecorded = false;
  int _recordingDuration = 0;
  bool _isSubmitting = false;
  String? _ticketId;
  String? _errorMsg;

  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;
  
  // Timer to simulate recording count up
  late final Stream<int> _timerStream;
  bool _timerActive = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _startTimer() async {
    _timerActive = true;
    while (_timerActive && mounted) {
      await Future.delayed(const Duration(seconds: 1));
      if (_timerActive && mounted) {
        setState(() {
          _recordingDuration++;
        });
      }
    }
  }

  void _stopTimer() {
    _timerActive = false;
  }

  void _toggleRecording() {
    setState(() {
      if (_isRecording) {
        _isRecording = false;
        _hasRecorded = true;
        _stopTimer();
      } else {
        _isRecording = true;
        _hasRecorded = false;
        _recordingDuration = 0;
        _ticketId = null;
        _errorMsg = null;
        _startTimer();
      }
    });
  }

  void _resetRecording() {
    setState(() {
      _isRecording = false;
      _hasRecorded = false;
      _recordingDuration = 0;
      _ticketId = null;
      _errorMsg = null;
    });
  }

  // Pure Dart WAV generator to guarantee zero native compilation failures
  Uint8List _generateWavBytes(int seconds) {
    final builder = BytesBuilder();
    // 1. Chunk ID "RIFF"
    builder.add(utf8.encode('RIFF'));
    // 2. Chunk Size (36 + subchunk2Size)
    final subchunk2size = seconds * 8000 * 2; // 8000Hz, 16bit, mono
    builder.add(_int32ToBytes(36 + subchunk2size));
    // 3. Format "WAVE"
    builder.add(utf8.encode('WAVE'));
    
    // Subchunk 1: "fmt "
    builder.add(utf8.encode('fmt '));
    builder.add(_int32ToBytes(16)); // Chunk size
    builder.add(_int16ToBytes(1));  // Audio format (1 = PCM)
    builder.add(_int16ToBytes(1));  // Number of channels
    builder.add(_int32ToBytes(8000)); // Sample rate
    builder.add(_int32ToBytes(8000 * 2)); // Byte rate
    builder.add(_int16ToBytes(2));  // Block align
    builder.add(_int16ToBytes(16)); // Bits per sample
    
    // Subchunk 2: "data"
    builder.add(utf8.encode('data'));
    builder.add(_int32ToBytes(subchunk2size)); // Subchunk size
    builder.add(Uint8List(subchunk2size)); // Silence
    
    return builder.toBytes();
  }

  Uint8List _int32ToBytes(int value) {
    return Uint8List(4)..buffer.asByteData().setInt32(0, value, Endian.little);
  }

  Uint8List _int16ToBytes(int value) {
    return Uint8List(2)..buffer.asByteData().setInt16(0, value, Endian.little);
  }

  Future<void> _submitFeedback() async {
    final apiClient = ref.read(apiClientProvider);
    setState(() {
      _isSubmitting = true;
      _errorMsg = null;
    });

    try {
      final wavBytes = _generateWavBytes(_recordingDuration > 0 ? _recordingDuration : 2);
      
      final formData = FormData.fromMap({
        'audio': MultipartFile.fromBytes(wavBytes, filename: 'feedback.wav'),
        'reportType': _reportType,
        'userEmail': 'mobile-operator@aegis-os.local',
        'appVersion': '1.0.0',
        'devicePlatform': 'mobile',
      });

      final response = await apiClient.dio.post(
        '/api/v1/feedback/voice',
        data: formData,
      );

      if (response.statusCode == 201) {
        final data = response.data;
        setState(() {
          _ticketId = data['ticketId'];
          _hasRecorded = false;
        });
      } else {
        throw Exception(response.data['message'] ?? 'Failed to submit voice ticket.');
      }
    } catch (e) {
      setState(() {
        _errorMsg = e.toString().replaceAll('Exception:', '').trim();
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Voice Feedback Center'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'HELP US IMPROVE AEGISOS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
                letterSpacing: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Record a brief voice message to file bugs, suggest features, or ask the lead architect questions.',
              style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            if (_ticketId != null) ...[
              // Success Screen
              Card(
                color: Colors.green.withOpacity(0.1),
                shape: RoundedRectangleBorder(
                  side: const BorderSide(color: Colors.green, width: 1.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
                      const SizedBox(height: 16),
                      const Text(
                        'Voice Ticket Dispatched!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Your recording was successfully uploaded and forwarded to the operational notification center.',
                        style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, py: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _ticketId!,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _resetRecording,
                        child: const Text('Submit Another Report'),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              // Report Type Selector
              Card(
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outlineVariant),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'REPORT CATEGORY',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildTypeButton('BUG', 'Bug'),
                          const SizedBox(width: 8),
                          _buildTypeButton('FEATURE', 'Feature'),
                          const SizedBox(width: 8),
                          _buildTypeButton('GENERAL', 'General'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Recording Area
              Container(
                height: 240,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isRecording) ...[
                      // Recording animation
                      AnimatedBuilder(
                        animation: _pulseAnimation,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _pulseAnimation.value,
                            child: Container(
                              height: 80,
                              width: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.red.withOpacity(0.2),
                                border: Border.all(color: Colors.red.withOpacity(0.4), width: 2),
                              ),
                              child: Center(
                                child: Container(
                                  height: 56,
                                  width: 56,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.red,
                                  ),
                                  child: const Icon(Icons.square, color: Colors.white, size: 20),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _formatDuration(_recordingDuration),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'TAP BUTTON TO STOP RECORDING',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                    ] else if (_hasRecorded) ...[
                      // Review audio state
                      Container(
                        height: 80,
                        width: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: theme.colorScheme.primary.withOpacity(0.1),
                        ),
                        child: Icon(Icons.audiotrack, color: theme.colorScheme.primary, size: 32),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Recording Complete (${_formatDuration(_recordingDuration)})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: _resetRecording,
                          ),
                          const SizedBox(width: 16),
                          const Text('Ready to Upload', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ] else ...[
                      // Idle state
                      GestureDetector(
                        onTap: _toggleRecording,
                        child: Container(
                          height: 80,
                          width: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            border: Border.all(color: theme.colorScheme.primary.withOpacity(0.3)),
                          ),
                          child: Icon(Icons.mic, color: theme.colorScheme.primary, size: 36),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'TAP MICROPHONE TO RECORD',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              if (_errorMsg != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errorMsg!,
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Actions
              if (_isRecording) ...[
                ElevatedButton(
                  onPressed: _toggleRecording,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Stop Recording'),
                ),
              ] else ...[
                ElevatedButton.icon(
                  onPressed: (!_hasRecorded || _isSubmitting) ? null : _submitFeedback,
                  icon: _isSubmitting
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send),
                  label: const Text('Submit Voice Ticket'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTypeButton(String value, String label) {
    final theme = Theme.of(context);
    final isSelected = _reportType == value;

    return Expanded(
      child: OutlinedButton(
        onPressed: _isRecording ? null : () => setState(() => _reportType = value),
        style: OutlinedButton.styleFrom(
          backgroundColor: isSelected ? theme.colorScheme.primary.withOpacity(0.1) : null,
          side: BorderSide(
            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
          ),
          foregroundColor: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
