import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/pages/auth_providers.dart';
import '../features/auth/presentation/pages/welcome_page.dart';
import '../features/auth/presentation/pages/qr_scanner_page.dart';
import '../features/auth/presentation/pages/manual_pairing_page.dart';
import '../features/auth/presentation/pages/approval_pending_page.dart';
import '../features/auth/presentation/pages/pairing_success_page.dart';
import '../features/auth/presentation/pages/biometric_unlock_page.dart';
import '../features/auth/presentation/pages/device_settings_page.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/dashboard/presentation/pages/infrastructure_page.dart';
import '../features/dashboard/presentation/pages/services_page.dart';
import '../features/dashboard/presentation/pages/models_page.dart';
import '../features/dashboard/presentation/pages/agents_page.dart';
import '../features/dashboard/presentation/pages/alerts_page.dart';
import '../features/dashboard/presentation/pages/command_center_page.dart';
import '../features/dashboard/presentation/pages/command_details_page.dart';
import '../features/dashboard/presentation/pages/approval_screen_page.dart';
import '../features/dashboard/presentation/pages/assistant_chat_page.dart';
import '../features/dashboard/presentation/pages/assistant_plan_approve_page.dart';
import '../features/dashboard/presentation/pages/projects_page.dart';
import '../features/dashboard/presentation/pages/upload_center_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authStatus = ref.watch(authStateNotifierProvider);

  return GoRouter(
    initialLocation: '/welcome',
    redirect: (context, state) {
      final matched = state.matchedLocation;

      // 1. If unpaired, force onboarding views
      if (authStatus == MobileAuthStatus.unpaired) {
        if (matched != '/welcome' && matched != '/scan' && matched != '/manual') {
          return '/welcome';
        }
        return null;
      }

      // 2. If pairing is waiting for console approval
      if (authStatus == MobileAuthStatus.pendingApproval) {
        if (matched != '/pending') {
          return '/pending';
        }
        return null;
      }

      // 3. If device is paired but biometric gate is locked
      if (authStatus == MobileAuthStatus.pairedLocked) {
        if (matched != '/unlock') {
          return '/unlock';
        }
        return null;
      }

      // 4. If device is paired and unlocked, allow access to dashboard and settings
      if (authStatus == MobileAuthStatus.pairedUnlocked) {
        if (matched == '/welcome' ||
            matched == '/scan' ||
            matched == '/manual' ||
            matched == '/pending' ||
            matched == '/unlock') {
          return '/';
        }
        return null;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: '/scan',
        builder: (context, state) => const QrScannerPage(),
      ),
      GoRoute(
        path: '/manual',
        builder: (context, state) => const ManualPairingPage(),
      ),
      GoRoute(
        path: '/pending',
        builder: (context, state) => const ApprovalPendingPage(),
      ),
      GoRoute(
        path: '/success',
        builder: (context, state) => const PairingSuccessPage(),
      ),
      GoRoute(
        path: '/unlock',
        builder: (context, state) => const BiometricUnlockPage(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const DeviceSettingsPage(),
      ),
      GoRoute(
        path: '/infra',
        builder: (context, state) => const InfrastructurePage(),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => const ServicesPage(),
      ),
      GoRoute(
        path: '/models',
        builder: (context, state) => const ModelsPage(),
      ),
      GoRoute(
        path: '/agents',
        builder: (context, state) => const AgentsPage(),
      ),
      GoRoute(
        path: '/alerts',
        builder: (context, state) => const AlertsPage(),
      ),
      GoRoute(
        path: '/projects',
        builder: (context, state) => const ProjectsPage(),
      ),
      GoRoute(
        path: '/upload',
        builder: (context, state) => const UploadCenterPage(),
      ),
      GoRoute(
        path: '/commands',
        builder: (context, state) => const CommandCenterPage(),
      ),
      GoRoute(
        path: '/commands/:id',
        builder: (context, state) => CommandDetailsPage(commandId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/commands/:id/approve',
        builder: (context, state) => ApprovalScreenPage(commandId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/assistant',
        builder: (context, state) => const AssistantChatPage(),
      ),
      GoRoute(
        path: '/commands/pending_chat_approve',
        builder: (context, state) => AssistantPlanApprovePage(messageId: state.extra as String),
      ),
    ],
  );
});
