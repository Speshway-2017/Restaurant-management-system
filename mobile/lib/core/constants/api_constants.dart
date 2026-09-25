import 'package:flutter/foundation.dart';

class ApiConstants {
  // ─────────────────────────────────────────────────────────────────────────
  // Backend Base URL — single source of truth across Web and Mobile.
  // ─────────────────────────────────────────────────────────────────────────
  static String _overrideBaseUrl = '';

  static String get baseUrl {
    if (_overrideBaseUrl.isNotEmpty) return _overrideBaseUrl;
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (kDebugMode) {
      // 192.168.1.4 is the local Wi-Fi host IP for physical Android device testing (I2401).
      // If using Android Emulator or ADB reverse (`adb reverse tcp:5000 tcp:5000`),
      // 127.0.0.1:5000 or 10.0.2.2:5000 can also be used.
      return defaultTargetPlatform == TargetPlatform.android
          ? 'http://192.168.1.4:5000/api'
          : 'http://localhost:5000/api';
    }
    return 'https://restaurant.speshway.site/api';
  }

  static set baseUrl(String val) {
    _overrideBaseUrl = val;
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
  static String waiterUpdateStatus(String orderId) => '/orders/$orderId/waiter-status';
  static String updateOrderStatus(String orderId) => '/orders/$orderId/status';
  static String requestCancelItem(String orderId) => '/orders/$orderId/cancel-request';
  static const String getAssistanceRequests = '/orders/assistance';
  static String updateAssistanceStatus(String id) => '/orders/assistance/$id/status';

  // Settings & Health Endpoint
  static const String getSettings = '/settings';
  static const String healthCheck = '/settings';
}
