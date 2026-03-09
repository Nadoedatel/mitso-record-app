class Subject {
  final int id;
  final String name;
  final String code;
  final int credits;
  final int semester;
  final String? description;

  const Subject({
    required this.id,
    required this.name,
    required this.code,
    required this.credits,
    required this.semester,
    this.description,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as int,
      name: json['name'] as String,
      code: json['code'] as String,
      credits: json['credits'] as int,
      semester: json['semester'] as int,
      description: json['description'] as String?,
    );
  }
}
