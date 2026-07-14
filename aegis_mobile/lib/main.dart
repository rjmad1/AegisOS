import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'bootstrap.dart';
import 'config/router.dart';
import 'config/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize dependency injection container and services
  final container = await bootstrap();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const AegisApp(),
    ),
  );
}

class AegisApp extends ConsumerWidget {
  const AegisApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'AegisOS Mobile',
      debugShowCheckedModeBanner: false,
      theme: AegisTheme.darkTheme,
      routerConfig: router,
    );
  }
}
