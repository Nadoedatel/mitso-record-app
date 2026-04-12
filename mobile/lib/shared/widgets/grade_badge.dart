import 'package:flutter/material.dart';

class GradeBadge extends StatelessWidget {
  final int value;
  final double size;

  const GradeBadge({super.key, required this.value, this.size = 14});

  Color _color() {
    if (value >= 90) return const Color(0xFF2E7D32);
    if (value >= 75) return const Color(0xFF1565C0);
    if (value >= 60) return const Color(0xFFF57F17);
    return const Color(0xFFC62828);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _color().withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: _color().withValues(alpha: 0.4)),
      ),
      child: Text(
        value.toString(),
        style: TextStyle(
          color: _color(),
          fontSize: size,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
