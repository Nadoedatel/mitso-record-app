import 'subject.dart';

enum GradeType { exam, credit, coursework, test, lab }

GradeType _parseGradeType(String raw) {
  switch (raw.toUpperCase()) {
    case 'CREDIT':
      return GradeType.credit;
    case 'COURSEWORK':
      return GradeType.coursework;
    case 'TEST':
      return GradeType.test;
    case 'LAB':
      return GradeType.lab;
    default:
      return GradeType.exam;
  }
}

String gradeTypeToJson(GradeType t) {
  switch (t) {
    case GradeType.exam:
      return 'EXAM';
    case GradeType.credit:
      return 'CREDIT';
    case GradeType.coursework:
      return 'COURSEWORK';
    case GradeType.test:
      return 'TEST';
    case GradeType.lab:
      return 'LAB';
  }
}

String gradeTypeLabel(GradeType t) {
  switch (t) {
    case GradeType.exam:
      return 'Экзамен';
    case GradeType.credit:
      return 'Зачёт';
    case GradeType.coursework:
      return 'Курсовая';
    case GradeType.test:
      return 'Контрольная';
    case GradeType.lab:
      return 'Лаб. работа';
  }
}

class Grade {
  final int id;
  final int studentId;
  final int subjectId;
  final int? teacherId;
  final int gradeValue;
  final GradeType gradeType;
  final DateTime? examDate;
  final String? notes;
  final Subject? subject;

  const Grade({
    required this.id,
    required this.studentId,
    required this.subjectId,
    this.teacherId,
    required this.gradeValue,
    required this.gradeType,
    this.examDate,
    this.notes,
    this.subject,
  });

  factory Grade.fromJson(Map<String, dynamic> json) {
    return Grade(
      id: json['id'] as int,
      studentId: json['studentId'] as int,
      subjectId: json['subjectId'] as int,
      teacherId: json['teacherId'] as int?,
      gradeValue: json['gradeValue'] as int,
      gradeType: _parseGradeType(json['gradeType'] as String),
      examDate: json['examDate'] != null
          ? DateTime.tryParse(json['examDate'] as String)
          : null,
      notes: json['notes'] as String?,
      subject: json['subject'] != null
          ? Subject.fromJson(json['subject'] as Map<String, dynamic>)
          : null,
    );
  }
}

class StudentWithGrade {
  final int id;
  final String firstName;
  final String lastName;
  final String? middleName;
  final String studentId;
  final Grade? grade;

  const StudentWithGrade({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.middleName,
    required this.studentId,
    this.grade,
  });

  String get fullName => '$lastName $firstName${middleName != null ? ' $middleName' : ''}';

  factory StudentWithGrade.fromJson(Map<String, dynamic> json) {
    return StudentWithGrade(
      id: json['id'] as int,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      middleName: json['middleName'] as String?,
      studentId: json['studentId'] as String,
      grade: json['grade'] != null
          ? Grade.fromJson(json['grade'] as Map<String, dynamic>)
          : null,
    );
  }
}
