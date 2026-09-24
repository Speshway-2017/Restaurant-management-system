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
  static String baseUrl = 'https://restaurant.speshway.site/api';

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
