class Teacher {
  final int id;
  final int userId;
  final String firstName;
  final String lastName;
  final String? middleName;
  final String department;
  final String position;
  final String? academicDegree;
  final String? phone;
  final String? officeNumber;

  const Teacher({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    this.middleName,
    required this.department,
    required this.position,
    this.academicDegree,
    this.phone,
    this.officeNumber,
  });

  String get fullName =>
      '$lastName $firstName${middleName != null ? ' $middleName' : ''}';

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'] as int,
      userId: json['userId'] as int,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      middleName: json['middleName'] as String?,
      department: json['department'] as String,
      position: json['position'] as String,
      academicDegree: json['academicDegree'] as String?,
      phone: json['phone'] as String?,
      officeNumber: json['officeNumber'] as String?,
    );
  }
}
