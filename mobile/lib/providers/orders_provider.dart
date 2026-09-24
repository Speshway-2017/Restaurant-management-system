import 'package:flutter/foundation.dart';
import '../models/order_model.dart';
import '../models/assistance_model.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../core/storage/storage_service.dart';
import '../core/utils/sound_service.dart';

class OrdersProvider with ChangeNotifier {
  List<OrderModel> _orders = [];
  List<AssistanceModel> _assistanceRequests = [];
  bool _isLoading = false;
  String? _error;
  OrderModel? _latestNewOrder;
  final Set<String> _knownOrderIds = {};

  List<OrderModel> get orders => _orders;
  List<AssistanceModel> get assistanceRequests => _assistanceRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;
  OrderModel? get latestNewOrder => _latestNewOrder;

  void clearLatestNewOrder() {
    _latestNewOrder = null;
    notifyListeners();
  }

  Future<void> _playNewOrderAlert() async {
    try {
      final soundEnabled = await StorageService.getSoundEnabled();
      if (soundEnabled) {
        final ringtone = await StorageService.getRingtone();
        SoundService.playRingtone(ringtone);
      }
    } catch (_) {}
  }

  // Handle Real-Time Socket.IO Order Created Event
  void handleSocketOrderCreated(Map<String, dynamic> data, {bool isCheckedIn = true}) {
    if (!isCheckedIn) return;
    try {
      final orderData = (data['order'] is Map)
          ? Map<String, dynamic>.from(data['order'])
          : data;
      final newOrd = OrderModel.fromJson(orderData);
      if (newOrd.id.isEmpty && newOrd.orderId == 'ORD-0000') return;

      final cleanId = newOrd.id.trim().toLowerCase();
      final cleanNum = newOrd.orderId.replaceAll('#', '').trim().toLowerCase();

      final wasLocallyRejected = _locallyRejectedOrderIds.contains(cleanId) ||
          _locallyRejectedOrderIds.contains(cleanNum) ||
          _locallyRejectedOrderIds.contains('#$cleanNum');

      if (wasLocallyRejected) return;

      final existingIdx = _orders.indexWhere((o) =>
          (o.id.isNotEmpty && cleanId.isNotEmpty && o.id.toLowerCase() == cleanId) ||
          (o.orderId.isNotEmpty && cleanNum.isNotEmpty && o.orderId.replaceAll('#', '').trim().toLowerCase() == cleanNum));

      if (existingIdx != -1) {
        _orders[existingIdx] = newOrd;
      } else {
        _orders.insert(0, newOrd);
      }

      if (newOrd.id.isNotEmpty) _knownOrderIds.add(newOrd.id);
      _latestNewOrder = newOrd;
      _playNewOrderAlert();

      notifyListeners();
    } catch (e) {
      if (kDebugMode) print('[OrdersProvider] error handling socket order_created: $e');
    }
  }

  // Handle Real-Time Socket.IO Order Updated Event
  void handleSocketOrderUpdated(Map<String, dynamic> data) {
    try {
      final orderData = (data['order'] is Map)
          ? Map<String, dynamic>.from(data['order'])
          : data;

      final updatedId = orderData['_id']?.toString() ?? orderData['id']?.toString() ?? orderData['orderId']?.toString() ?? '';
      if (updatedId.isEmpty) {
        fetchOrders(silent: true);
        return;
      }

      final cleanId = updatedId.trim().toLowerCase();
      final cleanNum = updatedId.replaceAll('#', '').trim().toLowerCase();

      final existingIdx = _orders.indexWhere((o) =>
          (o.id.isNotEmpty && cleanId.isNotEmpty && o.id.toLowerCase() == cleanId) ||
          (o.orderId.isNotEmpty && cleanNum.isNotEmpty && o.orderId.replaceAll('#', '').trim().toLowerCase() == cleanNum));

      if (existingIdx != -1) {
        if (orderData['items'] != null || orderData['waiterStatus'] != null || orderData['status'] != null) {
          final updatedOrd = OrderModel.fromJson(orderData);
          _orders[existingIdx] = updatedOrd;
          notifyListeners();
        } else {
          fetchOrders(silent: true);
        }
      } else {
        fetchOrders(silent: true);
      }
    } catch (e) {
      if (kDebugMode) print('[OrdersProvider] error handling socket order_updated: $e');
    }
  }

  // Return floor orders: unassigned/pending orders OR orders accepted by/assigned to this specific waiter
  List<OrderModel> getMyOrders(String waiterId, String waiterName, List<String> assignedTables) {
    final cleanId = waiterId.trim().toLowerCase();
    final cleanName = waiterName.trim().toLowerCase();

    return _orders.where((ord) {
      final ordId = ord.waiterId.trim().toLowerCase();
      final ordName = ord.waiterName.trim().toLowerCase();

      final isClaimed = ord.isAcceptedByWaiter || ordId.isNotEmpty || ordName.isNotEmpty;

      if (isClaimed) {
        // If order has been accepted by/assigned to a waiter, check if it matches current waiter
        bool belongsToMe = false;
        if (cleanId.isNotEmpty && ordId.isNotEmpty && ordId == cleanId) {
          belongsToMe = true;
        }
        if (cleanName.isNotEmpty && ordName.isNotEmpty && ordName == cleanName) {
          belongsToMe = true;
        }
        return belongsToMe;
      }

      // Unclaimed / pending orders remain visible so any waiter on floor can view and accept
      return true;
    }).toList();
  }

  // Filter ready orders belonging to this waiter (or unassigned ready orders)
  List<OrderModel> getReadyOrders(String waiterId, String waiterName, List<String> assignedTables) {
    final myOrds = getMyOrders(waiterId, waiterName, assignedTables);
    return myOrds.where((ord) => ord.isReadyToServe && !ord.isServed).toList();
  }

  double _gstRate = 0.05;
  double get gstRate => _gstRate;
  double get gstPercentageDisplay => _gstRate * 100;

  Future<void> fetchOrders({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      // Fetch admin settings for dynamic GST percentage rate
      try {
        final settingsRes = await ApiClient.get(ApiConstants.getSettings);
        if (settingsRes is Map && settingsRes['gstRate'] != null) {
          final rawStr = settingsRes['gstRate'].toString().replaceAll('%', '').trim();
          final parsed = double.tryParse(rawStr);
          if (parsed != null && parsed >= 0) {
            _gstRate = parsed > 1 ? parsed / 100.0 : parsed;
          }
        }
      } catch (_) {}

      final res = await ApiClient.get(ApiConstants.getOrders);
      if (res is List) {
        final fetchedOrders = res.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();

        // Check for new orders if already initialized
        if (_knownOrderIds.isNotEmpty) {
          for (var ord in fetchedOrders) {
            if (!_knownOrderIds.contains(ord.id) && ord.id.isNotEmpty && !ord.isPaid) {
              _latestNewOrder = ord;
              _playNewOrderAlert();
              break;
            }
          }
        }

        // Update known order IDs
        for (var ord in fetchedOrders) {
          if (ord.id.isNotEmpty) _knownOrderIds.add(ord.id);
        }

        _orders = fetchedOrders;
      }
      
      // Fetch waiter assistance calls
      try {
        final assistRes = await ApiClient.get(ApiConstants.getAssistanceRequests);
        if (assistRes is List) {
          _assistanceRequests = assistRes.map((e) => AssistanceModel.fromJson(e as Map<String, dynamic>)).toList();
        }
      } catch (_) {}

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  // 1. Waiter Accept Order
  Future<bool> acceptOrder(String orderId, String waiterId, String waiterName) async {
    try {
      // Optimistically update local order in list for immediate UI transition
      for (int i = 0; i < _orders.length; i++) {
        if (_orders[i].id == orderId || _orders[i].orderId == orderId) {
          final old = _orders[i];
          _orders[i] = OrderModel(
            id: old.id,
            orderId: old.orderId,
            table: old.table,
            customer: old.customer,
            sessionId: old.sessionId,
            sessionToken: old.sessionToken,
            status: (old.status.toLowerCase() == 'placed' || old.status.toLowerCase() == 'pending') ? 'Accepted' : old.status,
            chefStatus: old.chefStatus,
            waiterStatus: 'ACCEPTED',
            servingStatus: old.servingStatus,
            waiterId: waiterId,
            waiterName: waiterName,
            items: old.items,
            totalAmount: old.totalAmount,
            paymentStatus: old.paymentStatus,
            paymentMethod: old.paymentMethod,
            tipAmount: old.tipAmount,
            discountAmount: old.discountAmount,
            couponCode: old.couponCode,
            notes: old.notes,
            createdAt: old.createdAt,
          );
        }
      }
      notifyListeners();

      await ApiClient.patch(
        ApiConstants.waiterAcceptOrder(orderId),
        body: {'waiterId': waiterId, 'waiterName': waiterName},
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 1b. Waiter Reject Order
  Future<bool> rejectOrder(String orderId, String waiterId, String waiterName) async {
    try {
      await ApiClient.patch(
        ApiConstants.updateOrderStatus(orderId),
        body: {
          'status': 'Cancelled',
          'waiterStatus': 'REJECTED',
          'rejectedBy': waiterName,
        },
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 2. Waiter Update Serving Status (START SERVING -> SERVED)
  Future<bool> updateServingStatus(String orderId, String status, String waiterId, String waiterName) async {
    try {
      await ApiClient.patch(
        ApiConstants.waiterUpdateStatus(orderId),
        body: {
          'status': status,
          'waiterId': waiterId,
          'waiterName': waiterName,
        },
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 2b. Serve Ready Dishes (Only mark dishes that Chef has set as READY to SERVED)
  Future<bool> serveReadyItems(String orderId, String waiterId, String waiterName) async {
    return deliverSelectedItems(orderId, [], waiterId, waiterName);
  }

  // 2c. Deliver Selected Ready Items
  Future<bool> deliverSelectedItems(String orderId, List<String> selectedIdentifiers, String waiterId, String waiterName) async {
    try {
      final idx = _orders.indexWhere((o) => o.id == orderId || o.orderId == orderId);
      if (idx != -1) {
        final ord = _orders[idx];
        final readyItems = ord.activeItems.where((it) => (it.isReady || it.status == 'READY') && !it.isDelivered && it.status != 'SERVED' && it.status != 'DELIVERED').toList();

        final Set<String> targets = {};
        if (selectedIdentifiers.isNotEmpty) {
          for (var key in selectedIdentifiers) {
            if (key.isNotEmpty) targets.add(key);
            for (var item in ord.activeItems) {
              if (item.id == key || item.name == key) {
                if (item.id.isNotEmpty) targets.add(item.id);
                if (item.name.isNotEmpty) targets.add(item.name);
              }
            }
          }
        } else {
          for (var item in readyItems) {
            if (item.id.isNotEmpty) targets.add(item.id);
            if (item.name.isNotEmpty) targets.add(item.name);
          }
        }

        if (targets.isNotEmpty) {
          await ApiClient.patch(
            '/orders/${ord.id}/items/status',
            body: {
              'itemIds': targets.toList(),
              'status': 'DELIVERED',
            },
          );

          await fetchOrders();
          return true;
        } else {
          return true;
        }
      }
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 3. Request Item Cancellation
  Future<bool> requestCancelItems(String orderId, List<String> itemNames, String reason, String waiterName) async {
    try {
      await ApiClient.post(
        ApiConstants.requestCancelItem(orderId),
        body: {
          'itemsToCancel': itemNames,
          'reason': reason,
          'requestedBy': waiterName,
        },
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 4. Resolve Waiter Call
  Future<bool> resolveAssistance(String assistanceId) async {
    try {
      await ApiClient.patch(
        ApiConstants.updateAssistanceStatus(assistanceId),
        body: {'status': 'RESOLVED'},
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 5. Complete Payment (UPI / Card / Cash)
  Future<bool> completePayment(String orderId, String tableNum, String paymentMethod, double amountPaid, double tipAmount) async {
    try {
      // 1. Update order status to Paid
      await ApiClient.patch(
        ApiConstants.updateOrderStatus(orderId),
        body: {
          'status': 'Completed',
          'paymentStatus': 'Paid',
          'paymentMethod': paymentMethod,
          'tipAmount': tipAmount,
          'paidAmount': amountPaid,
        },
      );

      // 2. Set Table status to Cleaning
      try {
        await ApiClient.post(
          ApiConstants.vacateTable,
          body: {'tableNum': tableNum},
        );
      } catch (_) {}

      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // 6. Waiter Generate Bill Only
  Future<bool> generateBill(String orderId) async {
    try {
      // Optimistically update order status to Bill Generated locally
      for (int i = 0; i < _orders.length; i++) {
        if (_orders[i].id == orderId || _orders[i].orderId == orderId) {
          final old = _orders[i];
          _orders[i] = OrderModel(
            id: old.id,
            orderId: old.orderId,
            table: old.table,
            customer: old.customer,
            sessionId: old.sessionId,
            sessionToken: old.sessionToken,
            status: 'Bill Generated',
            chefStatus: old.chefStatus,
            waiterStatus: old.waiterStatus,
            servingStatus: old.servingStatus,
            waiterId: old.waiterId,
            waiterName: old.waiterName,
            items: old.items,
            totalAmount: old.totalAmount,
            paymentStatus: 'Awaiting Payment',
            paymentMethod: old.paymentMethod,
            tipAmount: old.tipAmount,
            discountAmount: old.discountAmount,
            couponCode: old.couponCode,
            notes: old.notes,
            createdAt: old.createdAt,
          );
        }
      }
      notifyListeners();

      await ApiClient.patch(
        ApiConstants.updateOrderStatus(orderId),
        body: {
          'status': 'Bill Generated',
          'paymentStatus': 'Awaiting Payment',
        },
      );
      await fetchOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
