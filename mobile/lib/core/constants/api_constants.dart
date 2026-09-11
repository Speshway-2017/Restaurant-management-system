import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class ApiConstants {
  // Local Wi-Fi IP address of your backend server for physical device testing
  static String hostIp = '192.168.1.4';

  // Base URL (Uses hostIp for physical devices, 10.0.2.2 for Android emulator fallback, localhost for Web/Desktop)
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (hostIp.isNotEmpty) {
      return 'http://$hostIp:5000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      }
    } catch (_) {}
    return 'http://localhost:5000/api';
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
