class Group {
  final int id;
  final String name;
  final int course;
  final int? facultyId;
  final int? studentCount;

  const Group({
    required this.id,
    required this.name,
    required this.course,
    this.facultyId,
    this.studentCount,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as int,
      name: json['name'] as String,
      course: json['course'] as int,
      facultyId: json['facultyId'] as int?,
      studentCount: json['studentCount'] as int?,
    );
  }

  @override
  bool operator ==(Object other) => other is Group && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
