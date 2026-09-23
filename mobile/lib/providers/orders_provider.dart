import 'package:flutter/material.dart';
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
  final Set<String> _locallyRejectedOrderIds = {};

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

  // Return floor orders: unassigned/pending orders OR orders accepted by/assigned to this specific waiter
  List<OrderModel> getMyOrders(String waiterId, String waiterName, List<String> assignedTables, {bool isCheckedIn = true}) {
    final cleanId = waiterId.trim().toLowerCase();
    final cleanName = waiterName.trim().toLowerCase();

    return _orders.where((ord) {
      final ordId = ord.waiterId.trim().toLowerCase();
      final ordName = ord.waiterName.trim().toLowerCase();

      final isAccepted = ord.isAcceptedByWaiter;

      if (isAccepted) {
        // Order was accepted by this waiter - visible in history/active for both IN and OUT
        bool belongsToMe = false;
        if (cleanId.isNotEmpty && ordId.isNotEmpty && ordId == cleanId) {
          belongsToMe = true;
        }
        if (cleanName.isNotEmpty && ordName.isNotEmpty && ordName == cleanName) {
          belongsToMe = true;
        }
        return belongsToMe;
      }

      return false;
    }).toList();
  }

  // Return ALL currently unaccepted pending orders in the shared pool (only for IN waiters)
  List<OrderModel> getPendingOrders(String waiterId, String waiterName, {bool isCheckedIn = true}) {
    if (!isCheckedIn) return [];
    final cleanId = waiterId.trim().toLowerCase();
    final cleanName = waiterName.trim().toLowerCase();

    return _orders.where((ord) {
      if (ord.isPaid || ord.status.toLowerCase() == 'cancelled' || ord.status.toLowerCase() == 'completed') {
        return false;
      }
      // Must not be claimed/accepted by any waiter yet
      if (ord.isAcceptedByWaiter || ord.waiterStatus.toUpperCase() != 'PENDING') {
        return false;
      }

      // Must not have been rejected locally during this session
      final ordId = ord.id.trim().toLowerCase();
      final ordNum = ord.orderId.trim().toLowerCase();
      final ordNumClean = ordNum.replaceAll('#', '').trim();

      if (_locallyRejectedOrderIds.contains(ordId) ||
          _locallyRejectedOrderIds.contains(ordNum) ||
          _locallyRejectedOrderIds.contains(ordNumClean) ||
          _locallyRejectedOrderIds.contains('#$ordNumClean')) {
        return false;
      }

      // Must not have been rejected by this specific waiter in DB
      final rejections = ord.rejectedByWaiters.map((r) => r.trim().toLowerCase()).toList();
      if (cleanId.isNotEmpty && rejections.contains(cleanId)) return false;
      if (cleanName.isNotEmpty && rejections.contains(cleanName)) return false;

      return true;
    }).toList();
  }

  // Filter ready orders belonging to this waiter (or unassigned ready orders)
  List<OrderModel> getReadyOrders(String waiterId, String waiterName, List<String> assignedTables, {bool isCheckedIn = true}) {
    final myOrds = getMyOrders(waiterId, waiterName, assignedTables, isCheckedIn: isCheckedIn);
    return myOrds.where((ord) => ord.isReadyToServe && !ord.isServed).toList();
  }

  double _gstRate = 0.05;
  double get gstRate => _gstRate;
  double get gstPercentageDisplay => _gstRate * 100;

  Future<void> fetchOrders({bool silent = false, bool isCheckedIn = true}) async {
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

        // Check for new orders if already initialized - ONLY if Waiter is IN
        if (_knownOrderIds.isNotEmpty && isCheckedIn) {
          for (var ord in fetchedOrders) {
            final ordId = ord.id.trim().toLowerCase();
            final ordNumClean = ord.orderId.replaceAll('#', '').trim().toLowerCase();
            final wasRejected = _locallyRejectedOrderIds.contains(ordId) ||
                _locallyRejectedOrderIds.contains(ord.orderId.toLowerCase()) ||
                _locallyRejectedOrderIds.contains(ordNumClean);

            if (!_knownOrderIds.contains(ord.id) && ord.id.isNotEmpty && !ord.isPaid && ord.waiterStatus == 'PENDING' && !wasRejected) {
              _latestNewOrder = ord;
              _playNewOrderAlert();
              break;
            }
          }
        } else if (!isCheckedIn) {
          _latestNewOrder = null;
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

  // 1. Waiter Accept Order (Atomic First-Accept-Wins with Claimed Check)
  Future<Map<String, dynamic>> acceptOrder(String orderId, String waiterId, String waiterName) async {
    try {
      await ApiClient.patch(
        ApiConstants.waiterAcceptOrder(orderId),
        body: {'waiterId': waiterId, 'waiterName': waiterName},
      );
      await fetchOrders(silent: true);
      return {'success': true, 'message': 'Order accepted successfully'};
    } catch (e) {
      final errStr = e.toString().replaceAll('Exception: ', '');
      await fetchOrders(silent: true);
      if (errStr.contains('already been accepted') || errStr.contains('ORDER_ALREADY_CLAIMED') || errStr.contains('409')) {
        return {
          'success': false,
          'alreadyClaimed': true,
          'message': 'Order has already been accepted by another waiter.',
        };
      }
      _error = errStr;
      notifyListeners();
      return {'success': false, 'alreadyClaimed': false, 'message': errStr};
    }
  }

  // 1b. Waiter Reject Order
  Future<bool> rejectOrder(String orderId, String waiterId, String waiterName) async {
    try {
      final clean = orderId.replaceAll('#', '').trim().toLowerCase();
      _locallyRejectedOrderIds.add(orderId.toLowerCase());
      if (clean.isNotEmpty) {
        _locallyRejectedOrderIds.add(clean);
        _locallyRejectedOrderIds.add('#$clean');
      }

      // Find any matching orders in local list to also grab their id and orderId
      final matches = _orders.where((o) =>
          o.id.toLowerCase() == orderId.toLowerCase() ||
          o.orderId.toLowerCase() == orderId.toLowerCase() ||
          o.orderId.toLowerCase().replaceAll('#', '').trim() == clean).toList();

      for (var o in matches) {
        if (o.id.isNotEmpty) _locallyRejectedOrderIds.add(o.id.toLowerCase());
        if (o.orderId.isNotEmpty) {
          final oClean = o.orderId.replaceAll('#', '').trim().toLowerCase();
          _locallyRejectedOrderIds.add(o.orderId.toLowerCase());
          _locallyRejectedOrderIds.add(oClean);
          _locallyRejectedOrderIds.add('#$oClean');
        }
      }

      // Optimistically remove from local list for this waiter
      _orders.removeWhere((o) =>
          o.id.toLowerCase() == orderId.toLowerCase() ||
          o.orderId.toLowerCase() == orderId.toLowerCase() ||
          o.orderId.toLowerCase().replaceAll('#', '').trim() == clean);
      notifyListeners();

      await ApiClient.patch(
        ApiConstants.waiterRejectOrder(orderId),
        body: {
          'waiterId': waiterId,
          'waiterName': waiterName,
        },
      );
      await fetchOrders(silent: true);
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
