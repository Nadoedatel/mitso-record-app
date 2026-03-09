import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/student/presentation/student_detail_screen.dart';
import '../../features/student/presentation/student_home_screen.dart';
import '../../features/teacher/presentation/grade_entry_screen.dart';
import '../../features/teacher/presentation/teacher_home_screen.dart';
import '../../shared/models/user.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  return GoRouter(
    refreshListenable: notifier,
    initialLocation: '/login',
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      if (authState.isLoading) return null;

      final user = authState.valueOrNull;
      final isLoggedIn = user != null;
      final path = state.matchedLocation;
      final isLoginRoute = path == '/login';

      if (!isLoggedIn && !isLoginRoute) return '/login';

      if (isLoggedIn && isLoginRoute) {
        return user.role == Role.teacher ? '/teacher' : '/student';
      }

      // Role guards
      if (isLoggedIn && user.role == Role.student && path.startsWith('/teacher')) {
        return '/student';
      }
      if (isLoggedIn && user.role == Role.teacher && path == '/student') {
        return '/teacher';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/student',
        builder: (_, __) => const StudentHomeScreen(),
      ),
      GoRoute(
        path: '/students/:id',
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return StudentDetailScreen(studentId: id);
        },
      ),
      GoRoute(
        path: '/teacher',
        builder: (_, __) => const TeacherHomeScreen(),
      ),
      GoRoute(
        path: '/teacher/grades',
        builder: (_, __) => const GradeEntryScreen(),
      ),
    ],
  );
});

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}
