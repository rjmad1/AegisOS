import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/pages/pairing_page.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';

// Providers mimicking pairing and authentication state
final pairingStateProvider = StateProvider<bool>((ref) => false);
final authStateProvider = StateProvider<bool>((ref) => false);

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isPaired = ref.read(pairingStateProvider);
      final isUnlocked = ref.read(authStateProvider);

      if (!isPaired && state.matchedLocation != '/pair') {
        return '/pair';
      }
      if (isPaired && !isUnlocked && state.matchedLocation != '/unlock') {
        return '/unlock';
      }
      if (isPaired && isUnlocked && (state.matchedLocation == '/pair' || state.matchedLocation == '/unlock')) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/pair',
        builder: (context, state) => const PairingPage(),
      ),
      GoRoute(
        path: '/unlock',
        builder: (context, state) => const UnlockMockPage(),
      ),
    ],
  );
});

// Temporary placeholder mock pages to bootstrap UI routing
class UnlockMockPage extends StatelessWidget {
  const UnlockMockPage({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Biometric Unlock Page')));
}
