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

  // studentId → GradeFormEntry
  final Map<int, GradeFormEntry> _gradeEntries = {};

  void _onSubjectChanged(Subject? s) {
    setState(() {
      _selectedSubject = s;
      _selectedGroup = null;
      _gradeEntries.clear();
    });
  }

  void _onGroupChanged(Group? g) {
    setState(() {
      _selectedGroup = g;
      _gradeEntries.clear();
      if (g != null && _selectedSubject != null) {
        final cached = ref.read(
          groupStudentsProvider((_selectedSubject!.id, g.id)),
        );
        if (cached is AsyncData<List<StudentWithGrade>>) {
          _initEntriesFromStudents(cached.value);
        }
      }
    });
  }

  void _initEntriesFromStudents(List<StudentWithGrade> students) {
    for (final s in students) {
      if (!_gradeEntries.containsKey(s.id)) {
        _gradeEntries[s.id] = const GradeFormEntry();
      }
    }
  }

  void _applyBulkGradeType(GradeType type) {
    setState(() {
      for (final key in _gradeEntries.keys.toList()) {
        _gradeEntries[key] = _gradeEntries[key]!.copyWith(gradeType: () => type);
      }
    });
  }

  void _applyBulkDate(DateTime? date) {
    setState(() {
      for (final key in _gradeEntries.keys.toList()) {
        _gradeEntries[key] = _gradeEntries[key]!.copyWith(examDate: () => date);
      }
    });
  }

  void _updateEntry(int studentId, GradeFormEntry entry) {
    setState(() => _gradeEntries[studentId] = entry);
  }

  Future<void> _save() async {
    final subjectId = _selectedSubject?.id;
    if (subjectId == null || _selectedGroup == null) return;

    final items = <BatchGradeItem>[];
    for (final entry in _gradeEntries.entries) {
      final e = entry.value;
      if (!e.isValid) continue;
      items.add(BatchGradeItem(
        studentId: entry.key,
        subjectId: subjectId,
        gradeValue: e.gradeValue!,
        gradeType: e.gradeType!,
        examDate: e.examDate,
        notes: e.notes.isNotEmpty ? e.notes : null,
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
          SnackBar(
            content: Text('Сохранено оценок: ${items.length}'),
            backgroundColor: Colors.green,
          ),
        );
        ref.invalidate(
          groupStudentsProvider((_selectedSubject!.id, _selectedGroup!.id)),
        );
        setState(() => _gradeEntries.clear());
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

    if (_selectedSubject != null && _selectedGroup != null) {
      ref.listen<AsyncValue<List<StudentWithGrade>>>(
        groupStudentsProvider((_selectedSubject!.id, _selectedGroup!.id)),
        (_, next) {
          if (next is AsyncData<List<StudentWithGrade>>) {
            setState(() => _initEntriesFromStudents(next.value));
          }
        },
      );
    }

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
              icon: const Icon(Icons.save_rounded),
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
                  onSubjectChanged: _onSubjectChanged,
                  onGroupChanged: _onGroupChanged,
                ),
                const Divider(height: 1),
                Expanded(
                  child: _selectedSubject == null || _selectedGroup == null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.school_outlined,
                                size: 48,
                                color: Theme.of(context).colorScheme.outlineVariant,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Выберите предмет и группу',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        )
                      : _StudentsTable(
                          key: ValueKey((_selectedSubject!.id, _selectedGroup!.id)),
                          subjectId: _selectedSubject!.id,
                          groupId: _selectedGroup!.id,
                          gradeEntries: _gradeEntries,
                          onEntryChanged: _updateEntry,
                          onBulkGradeType: _applyBulkGradeType,
                          onBulkDate: _applyBulkDate,
                        ),
                ),
              ],
            ),
    );
  }
}

// ─── Selectors ────────────────────────────────────────────────────────────────

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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          subjectsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => AppErrorWidget(error: e),
            data: (subjects) => InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Предмет',
                isDense: true,
              ),
              child: DropdownButton<Subject>(
                isExpanded: true,
                underline: const SizedBox(),
                isDense: true,
                value: selectedSubject,
                hint: const Text('Выберите предмет'),
                selectedItemBuilder: (context) => subjects
                    .map((s) => Text(
                          s.name,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ))
                    .toList(),
                items: subjects
                    .map((s) => DropdownMenuItem(
                          value: s,
                          child: Text(
                            '${s.name} (${s.code})',
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ))
                    .toList(),
                onChanged: onSubjectChanged,
              ),
            ),
          ),
          if (selectedSubject != null) ...[
            const SizedBox(height: 10),
            _GroupDropdown(
              subjectId: selectedSubject!.id,
              selectedGroup: selectedGroup,
              onChanged: onGroupChanged,
            ),
          ],
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
      data: (groups) => InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Группа',
          isDense: true,
        ),
        child: DropdownButton<Group>(
          isExpanded: true,
          underline: const SizedBox(),
          isDense: true,
          value: selectedGroup,
          hint: const Text('Выберите группу'),
          selectedItemBuilder: (context) => groups
              .map((g) => Text(
                    g.name,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ))
              .toList(),
          items: groups
              .map((g) => DropdownMenuItem(
                    value: g,
                    child: Text(
                      '${g.name} (${g.studentCount ?? 0} студентов)',
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

// ─── Students Table ──────────────────────────────────────────────────────────

class _StudentsTable extends ConsumerWidget {
  final int subjectId;
  final int groupId;
  final Map<int, GradeFormEntry> gradeEntries;
  final void Function(int studentId, GradeFormEntry entry) onEntryChanged;
  final void Function(GradeType) onBulkGradeType;
  final void Function(DateTime?) onBulkDate;

  const _StudentsTable({
    super.key,
    required this.subjectId,
    required this.groupId,
    required this.gradeEntries,
    required this.onEntryChanged,
    required this.onBulkGradeType,
    required this.onBulkDate,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(groupStudentsProvider((subjectId, groupId)));
    return studentsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        error: e,
        onRetry: () =>
            ref.invalidate(groupStudentsProvider((subjectId, groupId))),
      ),
      data: (students) {
        if (students.isEmpty) {
          return const Center(child: Text('В группе нет студентов'));
        }
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Column(
            children: [
              _BulkPanel(
                onBulkGradeType: onBulkGradeType,
                onBulkDate: onBulkDate,
              ),
              const SizedBox(height: 10),
              ...students.map((s) => _StudentGradeCard(
                    student: s,
                    entry: gradeEntries[s.id] ?? const GradeFormEntry(),
                    onChanged: (entry) => onEntryChanged(s.id, entry),
                  )),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }
}

// ─── Bulk Panel ──────────────────────────────────────────────────────────────

class _BulkPanel extends StatefulWidget {
  final void Function(GradeType) onBulkGradeType;
  final void Function(DateTime?) onBulkDate;

  const _BulkPanel({
    required this.onBulkGradeType,
    required this.onBulkDate,
  });

  @override
  State<_BulkPanel> createState() => _BulkPanelState();
}

class _BulkPanelState extends State<_BulkPanel> {
  GradeType? _bulkType;
  DateTime? _bulkDate;

  String _formatDate(DateTime date) {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    return '$d.$m.${date.year}';
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _bulkDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _bulkDate = picked);
      widget.onBulkDate(picked);
    }
  }

  void _clearDate() {
    setState(() => _bulkDate = null);
    widget.onBulkDate(null);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.primary.withValues(alpha: 0.25)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Тип для всех ───────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Тип для всех',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                DropdownButtonHideUnderline(
                  child: DropdownButton<GradeType>(
                    isExpanded: true,
                    isDense: true,
                    value: _bulkType,
                    hint: Text(
                      'Не выбран',
                      style: TextStyle(
                        fontSize: 13,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    style: TextStyle(fontSize: 13, color: colorScheme.onSurface),
                    items: GradeType.values
                        .map((t) => DropdownMenuItem(
                              value: t,
                              child: Text(
                                gradeTypeLabel(t),
                                style: const TextStyle(fontSize: 13),
                              ),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => _bulkType = v);
                        widget.onBulkGradeType(v);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 40,
            margin: const EdgeInsets.symmetric(horizontal: 12),
            color: colorScheme.outlineVariant,
          ),
          // ── Дата для всех ──────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Дата для всех',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: _pickDate,
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _bulkDate != null
                              ? _formatDate(_bulkDate!)
                              : 'Не выбрана',
                          style: TextStyle(
                            fontSize: 13,
                            color: _bulkDate != null
                                ? colorScheme.onSurface
                                : colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                      if (_bulkDate != null)
                        GestureDetector(
                          onTap: _clearDate,
                          child: Icon(
                            Icons.close_rounded,
                            size: 15,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        )
                      else
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Student Grade Card ──────────────────────────────────────────────────────

class _StudentGradeCard extends StatefulWidget {
  final StudentWithGrade student;
  final GradeFormEntry entry;
  final ValueChanged<GradeFormEntry> onChanged;

  const _StudentGradeCard({
    required this.student,
    required this.entry,
    required this.onChanged,
  });

  @override
  State<_StudentGradeCard> createState() => _StudentGradeCardState();
}

class _StudentGradeCardState extends State<_StudentGradeCard> {
  late final TextEditingController _notesController;

  static const _grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(text: widget.entry.notes);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final entry = widget.entry;
    final student = widget.student;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header: имя + существующая оценка ─────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.fullName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        student.studentId,
                        style: TextStyle(
                          fontSize: 11,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (student.grade != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${student.grade!.gradeValue} · ${gradeTypeLabel(student.grade!.gradeType)}',
                      style: TextStyle(
                        fontSize: 11,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            // ── Чипы оценки ───────────────────────────────────────────
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: [
                _GradeChip(
                  label: '—',
                  selected: entry.gradeValue == null,
                  onTap: () =>
                      widget.onChanged(entry.copyWith(gradeValue: () => null)),
                  colorScheme: colorScheme,
                ),
                ..._grades.map((g) => _GradeChip(
                      label: '$g',
                      selected: entry.gradeValue == g,
                      onTap: () =>
                          widget.onChanged(entry.copyWith(gradeValue: () => g)),
                      colorScheme: colorScheme,
                    )),
              ],
            ),
            // ── Примечание ────────────────────────────────────────────
            const SizedBox(height: 6),
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                hintText: 'Примечание',
                hintStyle:
                    TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                isDense: true,
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              style: const TextStyle(fontSize: 12),
              maxLines: 1,
              onChanged: (v) => widget.onChanged(entry.copyWith(notes: v)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Grade Chip ───────────────────────────────────────────────────────────────

class _GradeChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final ColorScheme colorScheme;

  const _GradeChip({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 34,
        height: 30,
        decoration: BoxDecoration(
          color: selected
              ? colorScheme.primary
              : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(6),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? colorScheme.onPrimary : colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}