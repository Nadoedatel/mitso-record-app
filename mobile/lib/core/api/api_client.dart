import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';

import 'api_exception.dart';

// iOS Simulator / Android Emulator: 'http://localhost:8080/api'
// Android Emulator:                 'http://10.0.2.2:8080/api'
// Physical Device (replace IP):     'http://192.168.x.x:8080/api'
const String _baseUrl = 'http://localhost:8080/api';

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  late Dio _dio;
  late PersistCookieJar _cookieJar;
  late FlutterSecureStorage _storage;
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _storage = const FlutterSecureStorage();
    final appDir = await getApplicationDocumentsDirectory();
    _cookieJar = PersistCookieJar(
      storage: FileStorage('${appDir.path}/.cookies/'),
    );

    // Separate Dio for refresh (no auth interceptor — avoids infinite loop)
    final refreshDio = Dio(BaseOptions(baseUrl: _baseUrl));
    refreshDio.interceptors.add(CookieManager(_cookieJar));
    refreshDio.interceptors.add(_ResponseUnwrapInterceptor());

    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));
    _dio.interceptors.add(CookieManager(_cookieJar));
    _dio.interceptors.add(_ResponseUnwrapInterceptor());
    _dio.interceptors.add(_AuthInterceptor(_storage, _cookieJar, refreshDio));
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => debugPrint('[Dio] $obj'),
      ));
    }

    _initialized = true;
  }

  Dio get dio => _dio;
  PersistCookieJar get cookieJar => _cookieJar;
  FlutterSecureStorage get storage => _storage;
}

/// Unwraps { "data": ..., "message": "ok" } envelope
class _ResponseUnwrapInterceptor extends Interceptor {
  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    final body = response.data;
    if (body is Map<String, dynamic> && body.containsKey('data')) {
      response.data = body['data'];
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;
    if (response != null) {
      final body = response.data;
      final message = body is Map ? (body['message'] ?? err.message ?? 'Unknown error') : err.message ?? 'Unknown error';
      handler.next(
        DioException(
          requestOptions: err.requestOptions,
          response: response,
          error: ApiException(statusCode: response.statusCode, message: message.toString()),
          type: err.type,
        ),
      );
      return;
    }
    handler.next(err);
  }
}

/// Adds Bearer token to every request; retries on 401 after refresh
class _AuthInterceptor extends QueuedInterceptorsWrapper {
  final FlutterSecureStorage _storage;
  final PersistCookieJar _cookieJar;
  final Dio _refreshDio;

  _AuthInterceptor(this._storage, this._cookieJar, this._refreshDio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'accessToken');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final is401 = err.response?.statusCode == 401 ||
        (err.error is ApiException && (err.error as ApiException).isUnauthorized);

    if (is401) {
      try {
        final refreshResp = await _refreshDio.post('/auth/refresh');
        final newToken = refreshResp.data['accessToken'] as String;
        await _storage.write(key: 'accessToken', value: newToken);

        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newToken';
        final retried = await _refreshDio.fetch(opts);
        handler.resolve(retried);
      } catch (_) {
        await _storage.delete(key: 'accessToken');
        await _cookieJar.deleteAll();
        handler.next(err);
      }
      return;
    }
    handler.next(err);
  }
}
