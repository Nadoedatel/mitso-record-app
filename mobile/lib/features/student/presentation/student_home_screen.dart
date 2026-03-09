import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/grade.dart';
import '../../../shared/models/student.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/grade_badge.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/student_provider.dart';

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    final student = user?.student;

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
              Tab(icon: Icon(Icons.grade_outlined), text: 'Оценки'),
              Tab(icon: Icon(Icons.search), text: 'Поиск'),
            ],
          ),
        ),
        body: student == null
            ? const LoadingWidget()
            : TabBarView(
                children: [
                  _ProfileTab(student: student),
                  _GradesTab(studentId: student.id),
                  const _SearchTab(),
                ],
              ),
      ),
    );
  }
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

class _ProfileTab extends StatelessWidget {
  final Student student;
  const _ProfileTab({required this.student});

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
                  '${student.firstName[0]}${student.lastName[0]}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                student.fullName,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _InfoRow(
                icon: Icons.badge_outlined,
                label: 'Зачётная книжка',
                value: student.studentId,
              ),
              _InfoRow(
                icon: Icons.group_outlined,
                label: 'Группа',
                value: student.group?.name ?? '—',
              ),
              _InfoRow(
                icon: Icons.school_outlined,
                label: 'Специализация',
                value: student.specialization?.name ?? '—',
              ),
              _InfoRow(
                icon: Icons.layers_outlined,
                label: 'Курс',
                value: '${student.course} курс',
              ),
              _InfoRow(
                icon: Icons.calendar_today_outlined,
                label: 'Год поступления',
                value: student.enrollmentYear.toString(),
              ),
              if (student.birthDate != null)
                _InfoRow(
                  icon: Icons.cake_outlined,
                  label: 'Дата рождения',
                  value: _formatDate(student.birthDate!),
                ),
              if (student.phone != null)
                _InfoRow(
                  icon: Icons.phone_outlined,
                  label: 'Телефон',
                  value: student.phone!,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDate(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';

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
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Grades Tab ─────────────────────────────────────────────────────────────

class _GradesTab extends ConsumerWidget {
  final int studentId;
  const _GradesTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(studentGradesProvider(studentId));
    return gradesAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        error: e,
        onRetry: () => ref.invalidate(studentGradesProvider(studentId)),
      ),
      data: (grades) => _GradesList(grades: grades),
    );
  }
}

class _GradesList extends StatelessWidget {
  final List<Grade> grades;
  const _GradesList({required this.grades});

  Map<int, List<Grade>> _bySemester() {
    final map = <int, List<Grade>>{};
    for (final g in grades) {
      map.putIfAbsent(g.subject?.semester ?? 0, () => []).add(g);
    }
    return Map.fromEntries(
      map.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (grades.isEmpty) {
      return const Center(child: Text('Оценок пока нет'));
    }
    final bySemester = _bySemester();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: bySemester.entries.map((entry) {
        final semester = entry.key;
        final semGrades = entry.value;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                semester > 0 ? '$semester семестр' : 'Без семестра',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: semGrades.map((g) {
                  return ListTile(
                    title: Text(g.subject?.name ?? 'Предмет #${g.subjectId}'),
                    subtitle: Text(gradeTypeLabel(g.gradeType)),
                    trailing: GradeBadge(value: g.gradeValue, size: 16),
                  );
                }).toList(),
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}

// ─── Search Tab ─────────────────────────────────────────────────────────────

class _SearchTab extends ConsumerStatefulWidget {
  const _SearchTab();

  @override
  ConsumerState<_SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends ConsumerState<_SearchTab> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(studentSearchProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _ctrl,
            decoration: InputDecoration(
              hintText: 'Поиск студентов...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _ctrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _ctrl.clear();
                        ref.read(studentSearchProvider.notifier).clear();
                      },
                    )
                  : null,
            ),
            onChanged: (q) {
              if (q.length >= 2) {
                ref.read(studentSearchProvider.notifier).search(q);
              } else if (q.isEmpty) {
                ref.read(studentSearchProvider.notifier).clear();
              }
            },
          ),
        ),
        Expanded(
          child: searchState.when(
            loading: () => const LoadingWidget(),
            error: (e, _) => AppErrorWidget(error: e),
            data: (students) {
              if (students.isEmpty && _ctrl.text.length >= 2) {
                return const Center(child: Text('Ничего не найдено'));
              }
              return ListView.builder(
                itemCount: students.length,
                itemBuilder: (ctx, i) {
                  final s = students[i];
                  return ListTile(
                    leading: CircleAvatar(child: Text('${s.firstName[0]}${s.lastName[0]}')),
                    title: Text(s.fullName),
                    subtitle: Text(s.group?.name ?? ''),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/students/${s.id}'),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
