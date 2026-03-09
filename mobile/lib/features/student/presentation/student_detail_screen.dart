import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/grade.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/grade_badge.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/student_provider.dart';

class StudentDetailScreen extends ConsumerWidget {
  final int studentId;
  const StudentDetailScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentAsync = ref.watch(studentByIdProvider(studentId));
    final gradesAsync = ref.watch(studentGradesProvider(studentId));

    return Scaffold(
      appBar: AppBar(title: const Text('Студент')),
      body: studentAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(studentByIdProvider(studentId)),
        ),
        data: (student) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor:
                                Theme.of(context).colorScheme.primaryContainer,
                            child: Text(
                              '${student.firstName[0]}${student.lastName[0]}',
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  student.fullName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  student.studentId,
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      if (student.group != null)
                        _Row('Группа', student.group!.name),
                      if (student.specialization != null)
                        _Row('Специализация', student.specialization!.name),
                      _Row('Курс', '${student.course} курс'),
                      _Row('Год поступления', student.enrollmentYear.toString()),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Оценки',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              gradesAsync.when(
                loading: () => const LoadingWidget(),
                error: (e, _) => AppErrorWidget(error: e),
                data: (grades) => grades.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Оценок нет'),
                      )
                    : Column(
                        children: grades.map((g) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(g.subject?.name ?? 'Предмет #${g.subjectId}'),
                            subtitle: Text(gradeTypeLabel(g.gradeType)),
                            trailing: GradeBadge(value: g.gradeValue, size: 16),
                          ),
                        )).toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label: ', style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
