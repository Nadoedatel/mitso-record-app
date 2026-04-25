import 'group.dart';

class Specialization {
  final int id;
  final String name;
  final String? code;

  const Specialization({required this.id, required this.name, this.code});

  factory Specialization.fromJson(Map<String, dynamic> json) {
    return Specialization(
      id: json['id'] as int,
      name: json['name'] as String,
      code: json['code'] as String?,
    );
  }
}

class Student {
  final int id;
  final int userId;
  final String firstName;
  final String lastName;
  final String? middleName;
  final String studentId; // номер зачётной книжки
  final int course;
  final int enrollmentYear;
  final String? phone;
  final String? address;
  final DateTime? birthDate;
  final Group? group;
  final Specialization? specialization;

  const Student({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    this.middleName,
    required this.studentId,
    required this.course,
    required this.enrollmentYear,
    this.phone,
    this.address,
    this.birthDate,
    this.group,
    this.specialization,
  });

  String get fullName =>
      '$lastName $firstName${middleName != null ? ' $middleName' : ''}';

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as int,
      userId: json['userId'] as int,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      middleName: json['middleName'] as String?,
      studentId: json['studentId'] as String,
      course: json['course'] as int,
      enrollmentYear: json['enrollmentYear'] as int,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      birthDate: json['birthDate'] != null
          ? DateTime.tryParse(json['birthDate'] as String)
          : null,
      group: json['group'] != null
          ? Group.fromJson(json['group'] as Map<String, dynamic>)
          : null,
      specialization: json['specialization'] != null
          ? Specialization.fromJson(json['specialization'] as Map<String, dynamic>)
          : null,
    );
  }
}
