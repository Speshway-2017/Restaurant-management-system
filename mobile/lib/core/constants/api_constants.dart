import 'package:flutter/foundation.dart';

class ApiConstants {
  static String _overrideBaseUrl = '';

  static void setOverrideBaseUrl(String url) {
    _overrideBaseUrl = url.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHYSICAL ANDROID DEVICE: Set your machine's LAN/Wi-Fi IP here.
  // Run `ipconfig` on Windows → look for "IPv4 Address" under your Wi-Fi
  // adapter (e.g. 192.168.1.5). Leave empty ('') to use emulator default.
  // ─────────────────────────────────────────────────────────────────────────
  static const String _lanIp = '192.168.1.4'; // Machine LAN IP (ipconfig → Wi-Fi IPv4)

  // Backend Base URL
  static String get baseUrl {
    if (_overrideBaseUrl.isNotEmpty) {
      return _overrideBaseUrl.endsWith('/api') ? _overrideBaseUrl : '$_overrideBaseUrl/api';
    }
    if (kIsWeb) {
      // When running as web (chrome/edge), derive host from the browser URL
      final host = Uri.base.host.isNotEmpty && Uri.base.host != '0.0.0.0'
          ? Uri.base.host
          : 'localhost';
      return 'http://$host:5000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      // On a physical device, 10.0.2.2 won't work — use the LAN IP if set.
      // On the Android Emulator, 10.0.2.2 maps to the host's localhost.
      final androidHost = _lanIp.isNotEmpty ? _lanIp : '10.0.2.2';
      return 'http://$androidHost:5000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosHost = _lanIp.isNotEmpty ? _lanIp : 'localhost';
      return 'http://$iosHost:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  // Socket.IO Server Root URL (without /api)
  static String get socketUrl {
    final base = baseUrl;
    return base.replaceAll(RegExp(r'/api/?$'), '');
  }

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String getMe = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Tables Endpoints
  static const String getTables = '/tables';
  static String updateTableStatus(String tableId) => '/tables/$tableId';
  static String assignTableWaiter(String tableNum) => '/tables/assign-waiter/$tableNum';
  static const String vacateTable = '/receptionist/tables/vacate';

  // Orders Endpoints
  static const String getOrders = '/orders';
  static String waiterAcceptOrder(String orderId) => '/orders/$orderId/waiter-accept';
  static String waiterRejectOrder(String orderId) => '/orders/$orderId/waiter-reject';
  static String waiterUpdateStatus(String orderId) => '/orders/$orderId/waiter-status';
  static String updateOrderStatus(String orderId) => '/orders/$orderId/status';
  static String requestCancelItem(String orderId) => '/orders/$orderId/cancel-request';
  static const String getAssistanceRequests = '/orders/assistance';
  static String updateAssistanceStatus(String id) => '/orders/assistance/$id/status';

  // Settings & Health Endpoint
  static const String getSettings = '/settings';
  static const String healthCheck = '/settings';
}
