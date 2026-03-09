import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/grade.dart';
import '../../../shared/models/student.dart';

class StudentRepository {
  const StudentRepository();

  Future<List<Grade>> getStudentGrades(int studentId) async {
    final response = await ApiClient.instance.dio.get('/grades/student/$studentId');
    final list = response.data as List<dynamic>;
    return list
        .map((e) => Grade.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Student>> searchStudents(String query, {int page = 1, int limit = 20}) async {
    final response = await ApiClient.instance.dio.get(
      '/students',
      queryParameters: {
        if (query.isNotEmpty) 'search': query,
        'page': page,
        'limit': limit,
      },
    );
    final data = response.data;
    final list = (data is Map ? data['items'] ?? data['students'] ?? data : data) as List<dynamic>;
    return list
        .map((e) => Student.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Student> getStudentById(int id) async {
    final response = await ApiClient.instance.dio.get('/students/$id');
    return Student.fromJson(response.data as Map<String, dynamic>);
  }
}

final studentRepositoryProvider =
    Provider<StudentRepository>((_) => const StudentRepository());
