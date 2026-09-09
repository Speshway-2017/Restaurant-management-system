import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../storage/storage_service.dart';

class ApiClient {
  static Future<Map<String, String>> _getHeaders() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await StorageService.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static dynamic _handleResponse(http.Response response) {
    dynamic jsonBody;
    try {
      jsonBody = jsonDecode(response.body);
    } catch (_) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.body;
      }
      throw Exception('Server returned invalid JSON (${response.statusCode})');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (jsonBody is Map<String, dynamic> && jsonBody.containsKey('data')) {
        return jsonBody['data'] ?? jsonBody;
      }
      return jsonBody;
    } else {
      String msg = 'Request failed (${response.statusCode})';
      if (jsonBody is Map<String, dynamic> && jsonBody.containsKey('message')) {
        msg = jsonBody['message'];
      }
      throw Exception(msg);
    }
  }

  static String _formatNetworkError(dynamic e) {
    final str = e.toString();
    if (str.contains('TimeoutException')) {
      return 'Connection timed out. Unable to reach backend at ${ApiConstants.baseUrl}. Please check server IP and Wi-Fi connection.';
    }
    if (str.contains('SocketException') || str.contains('Failed host lookup') || str.contains('Connection refused')) {
      return 'Server unreachable at ${ApiConstants.baseUrl}. Ensure device and server are on the same Wi-Fi.';
    }
    return str.replaceAll('Exception: ', '');
  }

  static Future<dynamic> get(String endpoint) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      throw Exception(_formatNetworkError(e));
    }
  }

  static Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .post(url, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      throw Exception(_formatNetworkError(e));
    }
  }

  static Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .put(url, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      throw Exception(_formatNetworkError(e));
    }
  }

  static Future<dynamic> patch(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .patch(url, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      throw Exception(_formatNetworkError(e));
    }
  }

  static Future<dynamic> delete(String endpoint) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http.delete(url, headers: headers).timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      throw Exception(_formatNetworkError(e));
    }
  }
}
