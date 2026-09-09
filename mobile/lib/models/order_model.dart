class OrderItemModel {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String status;
  final bool isReady;
  final bool isDelivered;
  final String notes;

  OrderItemModel({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    this.status = 'PLACED',
    this.isReady = false,
    this.isDelivered = false,
    this.notes = '',
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Dish Item',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      quantity: int.tryParse(json['quantity']?.toString() ?? json['qty']?.toString() ?? '1') ?? 1,
      status: json['status']?.toString() ?? 'PLACED',
      isReady: json['isReady'] == true || json['status'] == 'READY' || json['status'] == 'DELIVERED',
      isDelivered: json['isDelivered'] == true || json['status'] == 'DELIVERED' || json['status'] == 'SERVED',
      notes: json['notes']?.toString() ?? json['chefNotes']?.toString() ?? '',
    );
  }

  bool get isCancelled => status == 'CANCELLED' || status == 'Cancelled';
}

class OrderModel {
  final String id;
  final String orderId;
  final String table;
  final String customer;
  final String sessionId;
  final String sessionToken;
  final String status;
  final String chefStatus;
  final String waiterStatus;
  final String servingStatus;
  final String waiterId;
  final String waiterName;
  final List<OrderItemModel> items;
  final double totalAmount;
  final String paymentStatus;
  final String paymentMethod;
  final double tipAmount;
  final double discountAmount;
  final String couponCode;
  final String notes;
  final String createdAt;

  OrderModel({
    required this.id,
    required this.orderId,
    required this.table,
    this.customer = 'Guest Diner',
    this.sessionId = '',
    this.sessionToken = '',
    this.status = 'Placed',
    this.chefStatus = 'NEW',
    this.waiterStatus = 'PENDING',
    this.servingStatus = 'PENDING',
    this.waiterId = '',
    this.waiterName = '',
    this.items = const [],
    this.totalAmount = 0.0,
    this.paymentStatus = 'Pending',
    this.paymentMethod = 'Cash',
    this.tipAmount = 0.0,
    this.discountAmount = 0.0,
    this.couponCode = '',
    this.notes = '',
    this.createdAt = '',
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    List<OrderItemModel> itemList = [];
    if (json['items'] != null && json['items'] is List) {
      itemList = (json['items'] as List)
          .map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return OrderModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? json['_id']?.toString() ?? 'ORD-0000',
      table: json['table']?.toString() ?? json['tableNumber']?.toString() ?? 'T-01',
      customer: json['customer']?.toString() ?? json['customerName']?.toString() ?? 'Guest Diner',
      sessionId: json['sessionId']?.toString() ?? '',
      sessionToken: json['sessionToken']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Placed',
      chefStatus: json['chefStatus']?.toString() ?? 'NEW',
      waiterStatus: json['waiterStatus']?.toString() ?? 'PENDING',
      servingStatus: json['servingStatus']?.toString() ?? 'PENDING',
      waiterId: json['waiterId']?.toString() ?? '',
      waiterName: json['waiterName']?.toString() ?? '',
      items: itemList,
      totalAmount: double.tryParse(json['total']?.toString() ?? json['totalAmount']?.toString() ?? '0') ?? 0.0,
      paymentStatus: json['paymentStatus']?.toString() ?? json['payment']?.toString() ?? 'Pending',
      paymentMethod: json['paymentMethod']?.toString() ?? 'Cash',
      tipAmount: double.tryParse(json['tipAmount']?.toString() ?? json['tip']?.toString() ?? '0') ?? 0.0,
      discountAmount: double.tryParse(json['discountAmount']?.toString() ?? json['discount']?.toString() ?? '0') ?? 0.0,
      couponCode: json['couponCode']?.toString() ?? json['coupon']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? json['date']?.toString() ?? '',
    );
  }

  String get tableNum {
    final clean = table.replaceAll(RegExp(r'[^0-9]'), '');
    return clean.isNotEmpty ? clean : table;
  }

  bool get isReadyToServe => chefStatus == 'READY' || status == 'Ready';
  bool get isAcceptedByWaiter => waiterStatus == 'ACCEPTED' || waiterStatus == 'SERVING' || waiterStatus == 'SERVED';
  bool get isServingInTransit => waiterStatus == 'SERVING' || servingStatus == 'IN_TRANSIT';
  bool get isServed => waiterStatus == 'SERVED' || servingStatus == 'SERVED' || status == 'Served' || status == 'Completed';
  bool get isPaid => paymentStatus == 'Paid' || paymentStatus == 'Completed';

  double get calculatedSubtotal {
    double sum = 0;
    for (var item in items) {
      if (!item.isCancelled) {
        sum += item.price * item.quantity;
      }
    }
    return sum;
  }

  double getGstAmount([double? rate]) {
    final r = rate ?? 0.05;
    return calculatedSubtotal * r;
  }

  double getNetTotal([double? rate]) {
    final r = rate ?? 0.05;
    return (calculatedSubtotal - discountAmount) + getGstAmount(r);
  }

  double get gstAmount => getGstAmount(0.05);
  double get netTotal => getNetTotal(0.05);
}
