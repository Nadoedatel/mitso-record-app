import 'package:flutter/material.dart';

class AppErrorWidget extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;

  const AppErrorWidget({super.key, required this.error, this.onRetry});

  String _message() {
    final msg = error.toString();
    if (msg.contains('ApiException')) {
      final match = RegExp(r'ApiException\(\d+\): (.+)').firstMatch(msg);
      if (match != null) return match.group(1)!;
    }
    if (msg.contains('SocketException') || msg.contains('connection')) {
      return 'Нет соединения с сервером';
    }
    return 'Произошла ошибка. Попробуйте ещё раз.';
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            Text(
              _message(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Повторить'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
