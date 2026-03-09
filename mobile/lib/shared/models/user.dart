import 'student.dart';
import 'teacher.dart';

enum Role { student, teacher, admin }

Role _parseRole(String raw) {
  switch (raw.toUpperCase()) {
    case 'TEACHER':
      return Role.teacher;
    case 'ADMIN':
      return Role.admin;
    default:
      return Role.student;
  }
}

class User {
  final int id;
  final String email;
  final Role role;
  final Student? student;
  final Teacher? teacher;

  const User({
    required this.id,
    required this.email,
    required this.role,
    this.student,
    this.teacher,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      role: _parseRole(json['role'] as String),
      student: json['student'] != null
          ? Student.fromJson(json['student'] as Map<String, dynamic>)
          : null,
      teacher: json['teacher'] != null
          ? Teacher.fromJson(json['teacher'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AuthResponse {
  final User user;
  final String accessToken;

  const AuthResponse({required this.user, required this.accessToken});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: json['accessToken'] as String,
    );
  }
}
