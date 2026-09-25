import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../constants/api_constants.dart';
import '../../models/user_model.dart';

class SocketService {
  static socket_io.Socket? _socket;
  static UserModel? _currentUser;
  static bool _isCheckedIn = true;
  static Function(Map<String, dynamic>)? _onOrderCreatedCallback;
  static Function(Map<String, dynamic>)? _onOrderUpdatedCallback;
  static Function(Map<String, dynamic>)? _onChefReadyCallback;
  static Function(Map<String, dynamic>)? _onTableUpdatedCallback;

  static socket_io.Socket? get socket => _socket;
  static bool get isConnected => _socket?.connected ?? false;

  static void initSocket({
    UserModel? user,
    bool isCheckedIn = true,
    Function(Map<String, dynamic>)? onOrderCreated,
    Function(Map<String, dynamic>)? onOrderUpdated,
    Function(Map<String, dynamic>)? onChefReady,
    Function(Map<String, dynamic>)? onTableUpdated,
  }) {
    if (user != null) _currentUser = user;
    _isCheckedIn = isCheckedIn;

    if (onOrderCreated != null) _onOrderCreatedCallback = onOrderCreated;
    if (onOrderUpdated != null) _onOrderUpdatedCallback = onOrderUpdated;
    if (onChefReady != null) _onChefReadyCallback = onChefReady;
    if (onTableUpdated != null) _onTableUpdatedCallback = onTableUpdated;

    final targetUrl = ApiConstants.socketUrl;
    if (kDebugMode) {
      print('[Socket] Initiating socket connection to: $targetUrl');
    }

    if (_socket != null) {
      if (_socket!.connected) {
        joinRoom(_currentUser, isCheckedIn: _isCheckedIn);
        return;
      } else {
        _socket!.connect();
        return;
      }
    }

    final transports = kIsWeb ? ['websocket', 'polling'] : ['polling', 'websocket'];

    _socket = socket_io.io(targetUrl, socket_io.OptionBuilder()
      .setTransports(transports)
      .enableAutoConnect()
      .enableReconnection()
      .setReconnectionAttempts(15)
      .setReconnectionDelay(1000)
      .build());

    _socket!.onConnect((_) {
      if (kDebugMode) {
        print('[Socket] Connected successfully (ID: ${_socket!.id})');
      }
      joinRoom(_currentUser, isCheckedIn: _isCheckedIn);
    });

    _socket!.onDisconnect((_) {
      if (kDebugMode) {
        print('[Socket] Connection lost/disconnected');
      }
    });

    _socket!.onConnectError((err) {
      if (kDebugMode) {
        print('[Socket] Connection Error: $err');
      }
    });

    _socket!.onError((err) {
      if (kDebugMode) {
        print('[Socket] Socket Error: $err');
      }
    });

    // 1. Order Created Events
    _socket!.on('order_created', (data) {
      if (kDebugMode) print('[Socket Event] order_created: $data');
      _handleOrderCreatedEvent(data);
    });
    _socket!.on('order_created_waiter', (data) {
      if (kDebugMode) print('[Socket Event] order_created_waiter: $data');
      _handleOrderCreatedEvent(data);
    });
    _socket!.on('order_created_manager', (data) {
      if (kDebugMode) print('[Socket Event] order_created_manager: $data');
      _handleOrderCreatedEvent(data);
    });

    // 2. Order Updated & Status Events
    _socket!.on('order_status_updated', (data) {
      if (kDebugMode) print('[Socket Event] order_status_updated: $data');
      _handleOrderUpdatedEvent(data);
    });
    _socket!.on('order_updated', (data) {
      if (kDebugMode) print('[Socket Event] order_updated: $data');
      _handleOrderUpdatedEvent(data);
    });
    _socket!.on('waiter_accepted', (data) {
      if (kDebugMode) print('[Socket Event] waiter_accepted: $data');
      _handleOrderUpdatedEvent(data);
    });
    _socket!.on('waiter_serving', (data) {
      if (kDebugMode) print('[Socket Event] waiter_serving: $data');
      _handleOrderUpdatedEvent(data);
    });
    _socket!.on('waiter_served', (data) {
      if (kDebugMode) print('[Socket Event] waiter_served: $data');
      _handleOrderUpdatedEvent(data);
    });

    // 3. Chef Ready Events
    _socket!.on('chef_ready', (data) {
      if (kDebugMode) print('[Socket Event] chef_ready: $data');
      if (data is Map) {
        _onChefReadyCallback?.call(Map<String, dynamic>.from(data));
      }
      _handleOrderUpdatedEvent(data);
    });

    // 4. Table Updated Events
    _socket!.on('table_updated', (data) {
      if (kDebugMode) print('[Socket Event] table_updated: $data');
      if (data is Map) {
        _onTableUpdatedCallback?.call(Map<String, dynamic>.from(data));
      }
    });
  }

  static void _handleOrderCreatedEvent(dynamic data) {
    if (!_isCheckedIn) return; // Waiter OUT does not receive pending orders
    if (data is Map) {
      final mapData = Map<String, dynamic>.from(data);
      _onOrderCreatedCallback?.call(mapData);
    }
  }

  static void _handleOrderUpdatedEvent(dynamic data) {
    if (data is Map) {
      final mapData = Map<String, dynamic>.from(data);
      _onOrderUpdatedCallback?.call(mapData);
    }
  }

  static void joinRoom(UserModel? user, {bool isCheckedIn = true}) {
    if (user != null) _currentUser = user;
    _isCheckedIn = isCheckedIn;

    if (_socket == null || !_socket!.connected) return;

    final u = _currentUser;
    if (u == null) return;

    final userId = u.id;
    final role = u.role;
    final managerId = u.managerId;

    if (kDebugMode) {
      print('[Socket] Joining room for Waiter: ID=$userId, Role=$role, Manager=$managerId, CheckedIn=$isCheckedIn');
    }

    _socket!.emit('join', {
      'role': role,
      'userId': userId,
      'managerId': managerId,
    });
  }

  static void updateCheckInStatus(bool isCheckedIn) {
    _isCheckedIn = isCheckedIn;
    if (isCheckedIn) {
      joinRoom(_currentUser, isCheckedIn: true);
    }
  }

  static void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
      if (kDebugMode) print('[Socket] Service disconnected and cleaned up');
    }
  }
}
