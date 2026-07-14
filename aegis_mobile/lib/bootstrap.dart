import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

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
  final container = ProviderContainer();
  
  final logger = container.read(loggerProvider);
  logger.i('AegisOS Mobile: Starting bootstrap procedure...');
  
  // Future setups like database migrations, secure keystore readiness:
  // await container.read(databaseProvider).initialize();
  // await container.read(secureStorageProvider).initialize();
  
  logger.i('AegisOS Mobile: Bootstrap complete.');
  return container;
}
