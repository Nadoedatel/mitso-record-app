import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/models/user.dart';

class AuthRepository {
  const AuthRepository();

  Future<AuthResponse> login(String email, String password) async {
    final response = await ApiClient.instance.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data as Map<String, dynamic>;
    final token = data['accessToken'] as String;
    await ApiClient.instance.storage.write(key: 'accessToken', value: token);
    return AuthResponse.fromJson(data);
  }

  Future<User?> getMe() async {
    final token = await ApiClient.instance.storage.read(key: 'accessToken');
    if (token == null) return null;
    try {
      final response = await ApiClient.instance.dio.get('/auth/me');
      return User.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.dio.post('/auth/logout');
    } catch (_) {}
    await ApiClient.instance.storage.delete(key: 'accessToken');
    await ApiClient.instance.cookieJar.deleteAll();
  }
}

final authRepositoryProvider = Provider<AuthRepository>((_) => const AuthRepository());
