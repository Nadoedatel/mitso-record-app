import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/grade.dart';
import '../../../shared/models/group.dart';
import '../../../shared/models/subject.dart';

class BatchGradeItem {
  final int studentId;
  final int subjectId;
  final int gradeValue;
  final GradeType gradeType;
  final DateTime? examDate;

  const BatchGradeItem({
    required this.studentId,
    required this.subjectId,
    required this.gradeValue,
    required this.gradeType,
    this.examDate,
  });

  Map<String, dynamic> toJson() => {
        'studentId': studentId,
        'subjectId': subjectId,
        'gradeValue': gradeValue,
        'gradeType': gradeTypeToJson(gradeType),
        if (examDate != null) 'examDate': examDate!.toIso8601String(),
      };
}

class TeacherRepository {
  const TeacherRepository();

  Future<List<Subject>> getTeacherSubjects(int teacherId) async {
    final response =
        await ApiClient.instance.dio.get('/teachers/$teacherId/subjects');
    final list = response.data as List<dynamic>;
    return list
        .map((e) => Subject.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Group>> getSubjectGroups(int subjectId) async {
    final response = await ApiClient.instance.dio
        .get('/grades/subject/$subjectId/groups');
    final list = response.data as List<dynamic>;
    return list
        .map((e) => Group.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<StudentWithGrade>> getGroupStudentsWithGrades(
    int subjectId,
    int groupId,
  ) async {
    final response = await ApiClient.instance.dio.get(
      '/grades/subject/$subjectId/group/$groupId/students',
    );
    final list = response.data as List<dynamic>;
    return list
        .map((e) => StudentWithGrade.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveGrades(List<BatchGradeItem> items) async {
    await ApiClient.instance.dio.post('/grades/batch', data: {
      'grades': items.map((e) => e.toJson()).toList(),
    });
  }
}

final teacherRepositoryProvider =
    Provider<TeacherRepository>((_) => const TeacherRepository());
