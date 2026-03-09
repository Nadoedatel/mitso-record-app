import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/teacher.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/teacher_provider.dart';

class TeacherHomeScreen extends ConsumerWidget {
  const TeacherHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    final teacher = user?.teacher;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('MITSO Record'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Выйти',
              onPressed: () => ref.read(authProvider.notifier).logout(),
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.person_outlined), text: 'Профиль'),
              Tab(icon: Icon(Icons.book_outlined), text: 'Предметы'),
              Tab(icon: Icon(Icons.edit_outlined), text: 'Оценки'),
            ],
          ),
        ),
        body: teacher == null
            ? const LoadingWidget()
            : TabBarView(
                children: [
                  _ProfileTab(teacher: teacher),
                  _SubjectsTab(teacherId: teacher.id),
                  _GradeEntryTab(),
                ],
              ),
      ),
    );
  }
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

class _ProfileTab extends StatelessWidget {
  final Teacher teacher;
  const _ProfileTab({required this.teacher});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  '${teacher.firstName[0]}${teacher.lastName[0]}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                teacher.fullName,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _InfoRow(icon: Icons.business_outlined, label: 'Кафедра', value: teacher.department),
              _InfoRow(icon: Icons.work_outlined, label: 'Должность', value: teacher.position),
              if (teacher.academicDegree != null)
                _InfoRow(
                  icon: Icons.school_outlined,
                  label: 'Учёная степень',
                  value: teacher.academicDegree!,
                ),
              if (teacher.phone != null)
                _InfoRow(icon: Icons.phone_outlined, label: 'Телефон', value: teacher.phone!),
              if (teacher.officeNumber != null)
                _InfoRow(
                  icon: Icons.room_outlined,
                  label: 'Кабинет',
                  value: teacher.officeNumber!,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

// ─── Subjects Tab ────────────────────────────────────────────────────────────

class _SubjectsTab extends ConsumerWidget {
  final int teacherId;
  const _SubjectsTab({required this.teacherId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(teacherSubjectsProvider(teacherId));
    return subjectsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        error: e,
        onRetry: () => ref.invalidate(teacherSubjectsProvider(teacherId)),
      ),
      data: (subjects) {
        if (subjects.isEmpty) {
          return const Center(child: Text('Предметы не назначены'));
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
          ),
          itemCount: subjects.length,
          itemBuilder: (_, i) {
            final s = subjects[i];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.code,
                        style: TextStyle(
                          fontSize: 11,
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      s.name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Text(
                      '${s.semester} сем. · ${s.credits} кред.',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// ─── Grade Entry Tab ─────────────────────────────────────────────────────────

class _GradeEntryTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.edit_note, size: 64, color: Colors.grey),
          const SizedBox(height: 12),
          const Text('Перейдите на экран выставления оценок'),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.push('/teacher/grades'),
            icon: const Icon(Icons.arrow_forward),
            label: const Text('Выставить оценки'),
          ),
        ],
      ),
    );
  }
}
