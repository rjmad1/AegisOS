import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import 'infrastructure/persistence/drift_database.dart';
import 'features/auth/presentation/pages/auth_providers.dart';

final loggerProvider = Provider<Logger>((ref) {
  return Logger(
    printer: PrettyPrinter(
      methodCount: 2,
      errorMethodCount: 8,
      lineLength: 120,
      colors: true,
      printEmojis: true,
    ),
  );
});

// Bootstrapping helper. Prepares system services before rendering app.
Future<ProviderContainer> bootstrap() async {
  // Initialize local SQLite database
  final dbInstance = await AppDatabase.getInstance();

  final container = ProviderContainer(
    overrides: [
      databaseProvider.overrideWithValue(dbInstance),
    ],
  );
  
  final logger = container.read(loggerProvider);
  logger.i('AegisOS Mobile: Starting bootstrap procedure...');
  logger.i('AegisOS Mobile: Local SQLite persistence loaded.');
  
  logger.i('AegisOS Mobile: Bootstrap complete.');
  return container;
}
