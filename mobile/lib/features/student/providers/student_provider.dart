import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/grade.dart';
import '../../../shared/models/student.dart';
import '../data/student_repository.dart';

final studentGradesProvider =
    FutureProvider.family<List<Grade>, int>((ref, studentId) {
  return ref.read(studentRepositoryProvider).getStudentGrades(studentId);
});

final studentByIdProvider =
    FutureProvider.family<Student, int>((ref, id) {
  return ref.read(studentRepositoryProvider).getStudentById(id);
});

class StudentSearchNotifier extends AsyncNotifier<List<Student>> {
  @override
  Future<List<Student>> build() async => [];

  Future<void> search(String query) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(studentRepositoryProvider).searchStudents(query),
    );
  }

  void clear() {
    state = const AsyncValue.data([]);
  }
}

final studentSearchProvider =
    AsyncNotifierProvider<StudentSearchNotifier, List<Student>>(
        StudentSearchNotifier.new);
