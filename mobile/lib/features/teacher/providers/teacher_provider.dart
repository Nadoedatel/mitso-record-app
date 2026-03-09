import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/grade.dart';
import '../../../shared/models/group.dart';
import '../../../shared/models/subject.dart';
import '../data/teacher_repository.dart';

final teacherSubjectsProvider =
    FutureProvider.family<List<Subject>, int>((ref, teacherId) {
  return ref.read(teacherRepositoryProvider).getTeacherSubjects(teacherId);
});

final subjectGroupsProvider =
    FutureProvider.family<List<Group>, int>((ref, subjectId) {
  return ref.read(teacherRepositoryProvider).getSubjectGroups(subjectId);
});

final groupStudentsProvider =
    FutureProvider.family<List<StudentWithGrade>, (int, int)>((ref, args) {
  final (subjectId, groupId) = args;
  return ref
      .read(teacherRepositoryProvider)
      .getGroupStudentsWithGrades(subjectId, groupId);
});
