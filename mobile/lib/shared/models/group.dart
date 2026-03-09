class Group {
  final int id;
  final String name;
  final int course;
  final int? facultyId;

  const Group({
    required this.id,
    required this.name,
    required this.course,
    this.facultyId,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as int,
      name: json['name'] as String,
      course: json['course'] as int,
      facultyId: json['facultyId'] as int?,
    );
  }
}
