import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UploadCenterPage extends ConsumerStatefulWidget {
  const UploadCenterPage({super.key});

  @override
  ConsumerState<UploadCenterPage> createState() => _UploadCenterPageState();
}

class _UploadCenterPageState extends ConsumerState<UploadCenterPage> {
  final List<Map<String, dynamic>> _uploads = [];

  // Starts the mock upload progress flow
  void _startMockUpload(String filename, String size, IconData icon, Color color) {
    double progress = 0.0;
    Timer? timer;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            if (timer == null) {
              timer = Timer.periodic(const Duration(milliseconds: 150), (t) {
                if (progress >= 1.0) {
                  t.cancel();
                  Navigator.of(context).pop(); // Dismiss progress dialog
                  _completeUpload(filename, size, icon, color);
                } else {
                  setDialogState(() {
                    progress = (progress + 0.08 + (0.05 * (progress * 2))).clamp(0.0, 1.0);
                  });
                }
              });
            }

            return AlertDialog(
              backgroundColor: Theme.of(context).colorScheme.surface,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: Theme.of(context).colorScheme.outline),
                borderRadius: BorderRadius.circular(16),
              ),
              title: Row(
                children: [
                  Icon(Icons.cloud_upload_outlined, color: color),
                  const SizedBox(width: 12),
                  const Text('Uploading File', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    filename,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Size: $size | Target: Workstation Box',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 20),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: Colors.grey.withOpacity(0.1),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress: ${(progress * 100).toInt()}%',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const Text(
                        'Direct Stream (mTLS)',
                        style: TextStyle(color: Colors.grey, fontSize: 11, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    ).then((_) {
      timer?.cancel();
    });
  }

  void _completeUpload(String filename, String size, IconData icon, Color color) {
    setState(() {
      _uploads.insert(0, {
        'name': filename,
        'size': size,
        'icon': icon,
        'color': color,
        'time': 'Just now',
        'status': 'Synced',
      });
    });

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Successfully uploaded: $filename',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // Opens file picker dialog sheet
  void _openFilePicker(String category, List<Map<String, String>> mockFiles, IconData icon, Color color) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Select $category to Upload',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text('Pick a file to stream directly to workstation filesystem.', style: TextStyle(color: Colors.grey, fontSize: 11)),
                const SizedBox(height: 20),
                ...mockFiles.map((file) {
                  return Card(
                    color: theme.colorScheme.surface,
                    shape: RoundedRectangleBorder(
                      side: BorderSide(color: theme.colorScheme.outline.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      leading: Icon(icon, color: color),
                      title: Text(file['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                      subtitle: Text(file['size'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                      trailing: const Icon(Icons.upload_file_outlined),
                      onTap: () {
                        Navigator.pop(context);
                        _startMockUpload(file['name'] ?? '', file['size'] ?? '', icon, color);
                      },
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        );
      },
    );
  }

  void _openUrlDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        final theme = Theme.of(context);
        return AlertDialog(
          shape: RoundedRectangleBorder(
            side: BorderSide(color: theme.colorScheme.outline),
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Upload URL', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Enter a web link for workstation ingestion and indexing:', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'https://example.com/docs',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: theme.colorScheme.surface,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final url = controller.text.trim();
                if (url.isNotEmpty) {
                  Navigator.pop(context);
                  _startMockUpload(url, 'URL Link', Icons.link_outlined, Colors.teal);
                }
              },
              child: const Text('Ingest URL'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Center'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info Card
            Text(
              'Send files to your workstation',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Files are uploaded directly via secure tunnel. No on-device processing.',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 24),

            // Upload type cards
            _buildUploadCard(
              theme,
              icon: Icons.mic_outlined,
              title: 'Voice Recording',
              subtitle: 'Select mock voice notes & transcripts',
              color: Colors.blue,
              onTap: () => _openFilePicker('Voice Memo', [
                {'name': 'voice_memo_004.m4a', 'size': '1.4 MB'},
                {'name': 'meeting_transcript_12.m4a', 'size': '8.2 MB'},
              ], Icons.mic_outlined, Colors.blue),
            ),
            const SizedBox(height: 12),
            _buildUploadCard(
              theme,
              icon: Icons.image_outlined,
              title: 'Images & Visuals',
              subtitle: 'Photos, screenshots, whiteboard captures',
              color: Colors.purple,
              onTap: () => _openFilePicker('Image File', [
                {'name': 'dashboard_mockup_v1.png', 'size': '2.1 MB'},
                {'name': 'architecture_flow.jpg', 'size': '1.5 MB'},
                {'name': 'telemetry_screenshot.png', 'size': '750 KB'},
              ], Icons.image_outlined, Colors.purple),
            ),
            const SizedBox(height: 12),
            _buildUploadCard(
              theme,
              icon: Icons.picture_as_pdf_outlined,
              title: 'PDFs & Documents',
              subtitle: 'Books, technical papers, specs, text notes',
              color: Colors.red,
              onTap: () => _openFilePicker('Document File', [
                {'name': 'litellm_routing_api.pdf', 'size': '4.3 MB'},
                {'name': 'aegisos_prd_v1.md', 'size': '28 KB'},
                {'name': 'agents_task_graph.json', 'size': '14 KB'},
              ], Icons.picture_as_pdf_outlined, Colors.red),
            ),
            const SizedBox(height: 12),
            _buildUploadCard(
              theme,
              icon: Icons.link_outlined,
              title: 'Web URL Ingestion',
              subtitle: 'Enter link to parse, crawl and index',
              color: Colors.teal,
              onTap: _openUrlDialog,
            ),
            const SizedBox(height: 32),

            // Dynamic Recent Uploads section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Uploads',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${_uploads.length} items',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_uploads.isEmpty)
              Card(
                color: theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: theme.colorScheme.outline.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
                  child: Column(
                    children: [
                      Icon(
                        Icons.cloud_upload_outlined,
                        size: 48,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No uploads yet',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Uploaded files will appear here with dynamic workstation sync status.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.info_outline, size: 14, color: theme.primaryColor),
                            const SizedBox(width: 8),
                            Text(
                              'Interactive Demonstration Active',
                              style: TextStyle(
                                color: theme.primaryColor,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _uploads.length,
                itemBuilder: (context, index) {
                  final file = _uploads[index];
                  return Card(
                    color: theme.colorScheme.surface,
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      side: BorderSide(color: theme.colorScheme.outline.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: (file['color'] as Color).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(file['icon'] as IconData, color: file['color'] as Color, size: 20),
                      ),
                      title: Text(
                        file['name'] as String,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        'Size: ${file['size']} | ${file['time']}',
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Synced',
                          style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ),
                    ),
                  );
                },
              ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadCard(
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      color: theme.colorScheme.surface,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: theme.colorScheme.outline.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
