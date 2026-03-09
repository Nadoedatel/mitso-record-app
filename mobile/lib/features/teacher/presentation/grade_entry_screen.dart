import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/grade.dart';
import '../../../shared/models/group.dart';
import '../../../shared/models/subject.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../data/teacher_repository.dart';
import '../providers/teacher_provider.dart';

class GradeEntryScreen extends ConsumerStatefulWidget {
  const GradeEntryScreen({super.key});

  @override
  ConsumerState<GradeEntryScreen> createState() => _GradeEntryScreenState();
}

class _GradeEntryScreenState extends ConsumerState<GradeEntryScreen> {
  Subject? _selectedSubject;
  Group? _selectedGroup;
  bool _saving = false;

  // studentId → (gradeValue, gradeType)
  final Map<int, TextEditingController> _scoreControllers = {};
  final Map<int, GradeType> _gradeTypes = {};

  @override
  void dispose() {
    for (final c in _scoreControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _resetGroup() {
    setState(() {
      _selectedGroup = null;
      _scoreControllers.forEach((_, c) => c.dispose());
      _scoreControllers.clear();
      _gradeTypes.clear();
    });
  }

  Future<void> _save() async {
    final subjectId = _selectedSubject?.id;
    if (subjectId == null || _selectedGroup == null) return;

    final items = <BatchGradeItem>[];
    for (final entry in _scoreControllers.entries) {
      final studentId = entry.key;
      final text = entry.value.text.trim();
      if (text.isEmpty) continue;
      final value = int.tryParse(text);
      if (value == null || value < 0 || value > 100) continue;
      items.add(BatchGradeItem(
        studentId: studentId,
        subjectId: subjectId,
        gradeValue: value,
        gradeType: _gradeTypes[studentId] ?? GradeType.exam,
      ));
    }

    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Нет оценок для сохранения')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(teacherRepositoryProvider).saveGrades(items);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Оценки сохранены'),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh students list
        ref.invalidate(groupStudentsProvider((_selectedSubject!.id, _selectedGroup!.id)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка сохранения: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).valueOrNull;
    final teacherId = user?.teacher?.id;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Выставить оценки'),
        actions: [
          if (_saving)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.save),
              tooltip: 'Сохранить',
              onPressed: _selectedGroup != null ? _save : null,
            ),
        ],
      ),
      body: teacherId == null
          ? const LoadingWidget()
          : Column(
              children: [
                _Selectors(
                  teacherId: teacherId,
                  selectedSubject: _selectedSubject,
                  selectedGroup: _selectedGroup,
                  onSubjectChanged: (s) {
                    setState(() {
                      _selectedSubject = s;
                    });
                    _resetGroup();
                  },
                  onGroupChanged: (g) => setState(() => _selectedGroup = g),
                ),
                const Divider(height: 1),
                Expanded(
                  child: _selectedSubject == null || _selectedGroup == null
                      ? const Center(
                          child: Text(
                            'Выберите предмет и группу',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : _StudentsTable(
                          subjectId: _selectedSubject!.id,
                          groupId: _selectedGroup!.id,
                          scoreControllers: _scoreControllers,
                          gradeTypes: _gradeTypes,
                          onGradeTypeChanged: (studentId, t) =>
                              setState(() => _gradeTypes[studentId] = t),
                        ),
                ),
              ],
            ),
    );
  }
}

// ─── Selector Row ────────────────────────────────────────────────────────────

class _Selectors extends ConsumerWidget {
  final int teacherId;
  final Subject? selectedSubject;
  final Group? selectedGroup;
  final ValueChanged<Subject?> onSubjectChanged;
  final ValueChanged<Group?> onGroupChanged;

  const _Selectors({
    required this.teacherId,
    required this.selectedSubject,
    required this.selectedGroup,
    required this.onSubjectChanged,
    required this.onGroupChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(teacherSubjectsProvider(teacherId));

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Subject dropdown
          subjectsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => AppErrorWidget(error: e),
            data: (subjects) => DropdownButtonFormField<Subject>(
              decoration: const InputDecoration(labelText: 'Предмет'),
              value: selectedSubject,
              hint: const Text('Выберите предмет'),
              items: subjects
                  .map((s) => DropdownMenuItem(value: s, child: Text(s.name)))
                  .toList(),
              onChanged: onSubjectChanged,
            ),
          ),
          const SizedBox(height: 12),
          // Group dropdown — only shown after subject selected
          if (selectedSubject != null)
            _GroupDropdown(
              subjectId: selectedSubject!.id,
              selectedGroup: selectedGroup,
              onChanged: onGroupChanged,
            ),
        ],
      ),
    );
  }
}

class _GroupDropdown extends ConsumerWidget {
  final int subjectId;
  final Group? selectedGroup;
  final ValueChanged<Group?> onChanged;

  const _GroupDropdown({
    required this.subjectId,
    required this.selectedGroup,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupsAsync = ref.watch(subjectGroupsProvider(subjectId));
    return groupsAsync.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) => AppErrorWidget(error: e),
      data: (groups) => DropdownButtonFormField<Group>(
        decoration: const InputDecoration(labelText: 'Группа'),
        value: selectedGroup,
        hint: const Text('Выберите группу'),
        items: groups
            .map((g) => DropdownMenuItem(value: g, child: Text(g.name)))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }
}

// ─── Students Table ──────────────────────────────────────────────────────────

class _StudentsTable extends ConsumerWidget {
  final int subjectId;
  final int groupId;
  final Map<int, TextEditingController> scoreControllers;
  final Map<int, GradeType> gradeTypes;
  final void Function(int studentId, GradeType type) onGradeTypeChanged;

  const _StudentsTable({
    required this.subjectId,
    required this.groupId,
    required this.scoreControllers,
    required this.gradeTypes,
    required this.onGradeTypeChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(groupStudentsProvider((subjectId, groupId)));
    return studentsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        error: e,
        onRetry: () => ref.invalidate(groupStudentsProvider((subjectId, groupId))),
      ),
      data: (students) {
        if (students.isEmpty) {
          return const Center(child: Text('В группе нет студентов'));
        }
        // Initialize controllers for new students
        for (final s in students) {
          scoreControllers.putIfAbsent(
            s.id,
            () => TextEditingController(
              text: s.grade?.gradeValue.toString() ?? '',
            ),
          );
          gradeTypes.putIfAbsent(
            s.id,
            () => s.grade?.gradeType ?? GradeType.exam,
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: students.map((s) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.fullName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(s.studentId, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              controller: scoreControllers[s.id],
                              decoration: InputDecoration(
                                labelText: 'Оценка',
                                hintText: '0–100',
                                isDense: true,
                                suffixText: s.grade != null
                                    ? '(было: ${s.grade!.gradeValue})'
                                    : null,
                                suffixStyle: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 3,
                            child: DropdownButtonFormField<GradeType>(
                              decoration: const InputDecoration(
                                labelText: 'Тип',
                                isDense: true,
                              ),
                              value: gradeTypes[s.id],
                              items: GradeType.values
                                  .map((t) => DropdownMenuItem(
                                        value: t,
                                        child: Text(
                                          gradeTypeLabel(t),
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ))
                                  .toList(),
                              onChanged: (t) {
                                if (t != null) onGradeTypeChanged(s.id, t);
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}
