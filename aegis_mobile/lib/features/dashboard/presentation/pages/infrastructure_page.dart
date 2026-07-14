import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/telemetry_provider.dart';

class InfrastructurePage extends ConsumerWidget {
  const InfrastructurePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final telemetryState = ref.watch(telemetryProvider);
    final data = telemetryState.data;

    final cpuLoad = (data?['cpu']?['load'] ?? 0).toDouble();
    final gpuLoad = (data?['gpu']?['utilization'] ?? 0).toDouble();
    final temp = data?['cpu']?['temperature'] ?? 42.0;
    final battery = data?['battery']?['percent'] ?? 100;
    final rxNet = ((data?['network']?['rx'] ?? 0) / 1024).toStringAsFixed(1); // KB/s
    final txNet = ((data?['network']?['tx'] ?? 0) / 1024).toStringAsFixed(1); // KB/s

    // Resolve system uptime string
    final int uptimeSec = data?['uptime'] ?? 0;
    final int days = uptimeSec ~/ 86400;
    final int hours = (uptimeSec % 86400) ~/ 3600;
    final int minutes = (uptimeSec % 3600) ~/ 60;
    final uptimeText = days > 0 
        ? '${days}d ${hours}h ${minutes}m'
        : '${hours}h ${minutes}m';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hardware Telemetry'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Live Performance Chart Card
            Card(
              color: theme.colorScheme.surface,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: theme.colorScheme.outline),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Live Processor Load', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    const Text('Real-time CPU and GPU cores load history', style: TextStyle(color: Colors.grey, fontSize: 11)),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 180,
                      child: telemetryState.cpuHistory.isEmpty
                          ? const Center(child: Text('Awaiting telemetry frames...', style: TextStyle(color: Colors.grey)))
                          : LineChart(
                              LineChartData(
                                gridData: FlGridData(
                                  show: true,
                                  drawVerticalLine: false,
                                  getDrawingHorizontalLine: (value) => FlLine(
                                    color: Colors.grey.withOpacity(0.08),
                                    strokeWidth: 1,
                                  ),
                                ),
                                titlesData: const FlTitlesData(show: false),
                                borderData: FlBorderData(show: false),
                                minX: 0,
                                maxX: 20,
                                minY: 0,
                                maxY: 100,
                                lineBarsData: [
                                  // CPU Line (Purple)
                                  LineChartBarData(
                                    spots: telemetryState.cpuHistory
                                        .asMap()
                                        .entries
                                        .map((e) => FlSpot(e.key.toDouble(), e.value))
                                        .toList(),
                                    isCurved: true,
                                    color: Colors.purple,
                                    barWidth: 3,
                                    isStrokeCapRound: true,
                                    dotData: const FlDotData(show: false),
                                    belowBarData: BarAreaData(
                                      show: true,
                                      color: Colors.purple.withOpacity(0.05),
                                    ),
                                  ),
                                  // GPU Line (Cyan)
                                  LineChartBarData(
                                    spots: telemetryState.gpuHistory
                                        .asMap()
                                        .entries
                                        .map((e) => FlSpot(e.key.toDouble(), e.value))
                                        .toList(),
                                    isCurved: true,
                                    color: Colors.cyan,
                                    barWidth: 3,
                                    isStrokeCapRound: true,
                                    dotData: const FlDotData(show: false),
                                    belowBarData: BarAreaData(
                                      show: true,
                                      color: Colors.cyan.withOpacity(0.05),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                    const SizedBox(height: 16),
                    // Legend
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildLegendItem('CPU: ${cpuLoad.toInt()}%', Colors.purple),
                        const SizedBox(width: 24),
                        _buildLegendItem('GPU: ${gpuLoad.toInt()}%', Colors.cyan),
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 2. Network & Storage Grid
            Row(
              children: [
                Expanded(
                  child: Card(
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
                          const Row(
                            children: [
                              Icon(Icons.swap_calls_outlined, color: Colors.blueAccent),
                              SizedBox(width: 8),
                              Text('Network IO', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Down', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              Text('$rxNet KB/s', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Up', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              Text('$txNet KB/s', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Card(
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
                          const Row(
                            children: [
                              Icon(Icons.thermostat_outlined, color: Colors.amber),
                              SizedBox(width: 8),
                              Text('Sensors', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Temp', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              Text('$temp°C', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Battery', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              Text('$battery%', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              ],
            ),
            const SizedBox(height: 16),

            // 3. Storage Partitions Volume Bars
            Card(
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
                    const Row(
                      children: [
                        Icon(Icons.storage, color: Colors.deepPurpleAccent, size: 20),
                        SizedBox(width: 8),
                        Text('Disk Volumes & Partitions', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (data?['disk']?['mountedVolumes'] != null && (data?['disk']?['mountedVolumes'] as List).isNotEmpty)
                      ...(data?['disk']?['mountedVolumes'] as List).map((vol) {
                        final String mountPoint = vol['mountPoint'] ?? '/';
                        final double usagePercent = (vol['usagePercent'] ?? 0.0) / 100.0;
                        final double sizeGB = (vol['sizeBytes'] ?? 0) / (1024 * 1024 * 1024);
                        final double freeGB = (vol['freeBytes'] ?? 0) / (1024 * 1024 * 1024);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16.0),
                          child: _buildPartitionBar(
                            context,
                            mountPoint,
                            usagePercent,
                            '${freeGB.toStringAsFixed(0)} GB Free / ${sizeGB.toStringAsFixed(0)} GB Total',
                          ),
                        );
                      }).toList()
                    else ...[
                      _buildPartitionBar(context, 'C:\\ (System SSD)', 0.74, '132 GB Free / 512 GB Total'),
                      const SizedBox(height: 16),
                      _buildPartitionBar(context, 'D:\\ (Model Weights)', 0.45, '281 GB Free / 512 GB Total'),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 4. System Uptime Card
            Card(
              color: theme.colorScheme.surface,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: theme.colorScheme.outline),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ListTile(
                leading: const Icon(Icons.timer_outlined, color: Colors.blueAccent),
                title: const Text('Workstation Uptime', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(uptimeText),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          height: 10,
          width: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildPartitionBar(BuildContext context, String name, double value, String label) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 8,
            backgroundColor: Colors.grey.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(theme.primaryColor),
          ),
        ),
      ],
    );
  }
}
