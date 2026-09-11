import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/status_badge_widget.dart';
import '../../widgets/custom_button.dart';

class OrderDetailScreen extends StatefulWidget {
  final OrderModel order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final Set<String> _selectedCancelItems = {};
  final Set<String> _selectedDeliverItems = {};
  final _cancelReasonController = TextEditingController();
  bool _isActionLoading = false;
  Timer? _refreshTimer;
  String? _currentOrderId;

  @override
  void initState() {
    super.initState();
    _currentOrderId = widget.order.id;
    _initSelectionState(widget.order);

    // Requirement 8: Real-time synchronization timer (polls every 4 seconds silently)
    _refreshTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted) {
        Provider.of<OrdersProvider>(context, listen: false).fetchOrders(silent: true);
      }
    });
  }

  void _initSelectionState(OrderModel ord) {
    _selectedDeliverItems.clear();
    _selectedCancelItems.clear();

    // Auto-select all READY items initially for convenient delivery
    for (var item in ord.activeItems) {
      final bool isReady = (item.isReady || item.status == 'READY') &&
          !item.isDelivered &&
          item.status != 'SERVED' &&
          item.status != 'DELIVERED';
      if (isReady) {
        final key = item.id.isNotEmpty ? item.id : item.name;
        if (key.isNotEmpty) {
          _selectedDeliverItems.add(key);
        }
      }
    }
  }

  @override
  void didUpdateWidget(OrderDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Requirement 9: Order Isolation - reset selection state when navigating to another order
    if (oldWidget.order.id != widget.order.id || _currentOrderId != widget.order.id) {
      _currentOrderId = widget.order.id;
      _initSelectionState(widget.order);
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _cancelReasonController.dispose();
    super.dispose();
  }

  void _showCancelDialog() {
    if (_selectedCancelItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one item to cancel.')),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Request Item Cancellation'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Items to cancel: ${_selectedCancelItems.join(', ')}'),
              const SizedBox(height: 12),
              TextField(
                controller: _cancelReasonController,
                decoration: const InputDecoration(
                  labelText: 'Cancellation Reason',
                  hintText: 'Customer changed mind / Out of stock',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Back'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.cancelledText),
              onPressed: () async {
                Navigator.pop(ctx);
                final messenger = ScaffoldMessenger.of(context);
                final user = Provider.of<AuthProvider>(context, listen: false).user;
                final provider = Provider.of<OrdersProvider>(context, listen: false);

                setState(() => _isActionLoading = true);
                final success = await provider.requestCancelItems(
                  widget.order.id,
                  _selectedCancelItems.toList(),
                  _cancelReasonController.text.trim(),
                  user?.name ?? 'Waiter',
                );
                setState(() => _isActionLoading = false);

                if (success && mounted) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Cancellation request sent to manager for approval!')),
                  );
                }
              },
              child: const Text('Submit Request', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProgressSection(OrderModel currentOrd) {
    final activeItems = currentOrd.activeItems;
    final totalItemsCount = activeItems.fold<int>(0, (sum, i) => sum + i.quantity);
    final deliveredCount = activeItems
        .where((i) => i.isDelivered || i.status == 'SERVED' || i.status == 'DELIVERED')
        .fold<int>(0, (sum, i) => sum + i.quantity);
    final readyCount = currentOrd.readyItemsCount;
    final pendingCount = currentOrd.pendingItemsCount;

    final double progressRatio = totalItemsCount > 0 ? (deliveredCount / totalItemsCount) : 0.0;
    final int progressPercentage = (progressRatio * 100).round();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Order Delivery Progress',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                ),
                Text(
                  '$deliveredCount of $totalItemsCount delivered ($progressPercentage%)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: deliveredCount == totalItemsCount ? AppColors.accentGreen : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progressRatio,
                minHeight: 8,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: AlwaysStoppedAnimation<Color>(
                  deliveredCount == totalItemsCount ? AppColors.accentGreen : const Color(0xFF283593),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  deliveredCount == totalItemsCount
                      ? '✓ All items delivered to table'
                      : '${totalItemsCount - deliveredCount} item${(totalItemsCount - deliveredCount) > 1 ? 's' : ''} remaining',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: deliveredCount == totalItemsCount ? AppColors.accentGreen : AppColors.textSecondary,
                  ),
                ),
                if (readyCount > 0)
                  Text(
                    '🔔 $readyCount Ready to Serve',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                  )
                else if (pendingCount > 0)
                  Text(
                    '⏳ $pendingCount Preparing',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final ordersProvider = Provider.of<OrdersProvider>(context);

    // Refresh current order state from Provider
    final currentOrd = ordersProvider.orders.firstWhere(
      (o) => o.id == widget.order.id || o.orderId == widget.order.orderId,
      orElse: () => widget.order,
    );

    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';

    final readyItemsList = currentOrd.activeItems
        .where((it) => (it.isReady || it.status == 'READY') && !it.isDelivered && it.status != 'SERVED' && it.status != 'DELIVERED')
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('Order #${currentOrd.orderId} Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.darkGreen,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Table ${currentOrd.table}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        StatusBadgeWidget(
                            status: currentOrd.isPaid
                                ? 'Completed'
                                : (currentOrd.isBillGenerated
                                    ? 'Bill Generated'
                                    : (currentOrd.isServed
                                        ? 'Served'
                                        : (currentOrd.readyItemsCount > 0
                                            ? 'Ready'
                                            : (currentOrd.servedItemsCount > 0
                                                ? 'Partially Delivered'
                                                : (currentOrd.isServingInTransit ? 'Serving' : currentOrd.status)))))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Customer: ${currentOrd.customer}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text('Order ID: ${currentOrd.orderId}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Requirement 5: Order Progress Section
            _buildProgressSection(currentOrd),
            const SizedBox(height: 16),

            // Order Items Header & Quick Selection Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Order Items',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                Row(
                  children: [
                    if (readyItemsList.isNotEmpty && !currentOrd.isServed) ...[
                      TextButton(
                        onPressed: () {
                          setState(() {
                            final allSelected = readyItemsList.every((it) {
                              final key = it.id.isNotEmpty ? it.id : it.name;
                              return _selectedDeliverItems.contains(key);
                            });

                            if (allSelected) {
                              _selectedDeliverItems.clear();
                            } else {
                              for (var item in readyItemsList) {
                                final key = item.id.isNotEmpty ? item.id : item.name;
                                if (key.isNotEmpty) _selectedDeliverItems.add(key);
                              }
                            }
                          });
                        },
                        child: Text(
                          readyItemsList.isNotEmpty && readyItemsList.every((it) => _selectedDeliverItems.contains(it.id.isNotEmpty ? it.id : it.name))
                              ? 'Deselect All'
                              : 'Select All Ready',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accentGreen),
                        ),
                      ),
                    ],
                    if (currentOrd.isAcceptedByWaiter && !currentOrd.isServed) ...[
                      TextButton.icon(
                        onPressed: _showCancelDialog,
                        icon: const Icon(Icons.cancel_outlined, size: 16, color: AppColors.cancelledText),
                        label: const Text('Cancel Item', style: TextStyle(color: AppColors.cancelledText, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Requirement 1, 2, 3: Item List with Item Status Badges & Delivery Checkboxes
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: currentOrd.items.map((item) {
                    final bool isServed = item.isDelivered || item.status == 'SERVED' || item.status == 'DELIVERED';
                    final bool isReady = !isServed && !item.isCancelled && (item.isReady || item.status == 'READY');
                    final bool isPreparing = !isServed && !item.isCancelled && !isReady;
                    final String itemKey = item.id.isNotEmpty ? item.id : item.name;

                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isReady
                            ? const Color(0xFFDCFCE7)
                            : (isServed ? const Color(0xFFF8FAFC) : (isPreparing ? const Color(0xFFFFFBEB) : Colors.white)),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isReady
                              ? const Color(0xFF86EFAC)
                              : (isServed ? const Color(0xFFCBD5E1) : (isPreparing ? const Color(0xFFFCD34D) : const Color(0xFFE2E8F0))),
                          width: isReady ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          // Requirement 3: Delivery Selection Checkbox for READY items only
                          if (currentOrd.isAcceptedByWaiter && !currentOrd.isServed && !item.isCancelled) ...[
                            if (isReady) ...[
                              Checkbox(
                                activeColor: AppColors.darkGreen,
                                value: _selectedDeliverItems.contains(itemKey),
                                onChanged: (val) {
                                  setState(() {
                                    if (val == true) {
                                      _selectedDeliverItems.add(itemKey);
                                    } else {
                                      _selectedDeliverItems.remove(itemKey);
                                    }
                                  });
                                },
                              ),
                            ] else if (isServed) ...[
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 10),
                                child: Icon(Icons.check_circle, color: Color(0xFF64748B), size: 20),
                              ),
                            ] else ...[
                              // PREPARING items cannot be selected for delivery
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 10),
                                child: Icon(Icons.hourglass_empty_rounded, color: Color(0xFFD97706), size: 20),
                              ),
                            ],
                          ],
                          Text(
                            '${item.quantity}x ',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: isReady ? const Color(0xFF166534) : (isServed ? const Color(0xFF64748B) : const Color(0xFFD97706)),
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    decoration: item.isCancelled ? TextDecoration.lineThrough : null,
                                    color: item.isCancelled
                                        ? AppColors.cancelledText
                                        : (isServed
                                            ? const Color(0xFF64748B)
                                            : (isReady ? const Color(0xFF166534) : AppColors.textPrimary)),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                // Requirement 1: Item status badges
                                if (item.isCancelled)
                                  const Text('CANCELLED', style: TextStyle(fontSize: 10, color: AppColors.cancelledText, fontWeight: FontWeight.bold))
                                else if (isServed)
                                  const Text('✅ SERVED TO TABLE', style: TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.bold))
                                else if (isReady)
                                  const Text('🟢 READY TO SERVE', style: TextStyle(fontSize: 10, color: Color(0xFF166534), fontWeight: FontWeight.bold))
                                else
                                  const Text('⏳ PREPARING IN KITCHEN', style: TextStyle(fontSize: 10, color: Color(0xFFD97706), fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Text(
                            '₹${(item.price * item.quantity).toStringAsFixed(0)}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: isReady ? const Color(0xFF166534) : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Payment Financial Breakdown
            Builder(
              builder: (context) {
                final gstRate = ordersProvider.gstRate;
                final originalTotal = currentOrd.calculatedSubtotal > 0 ? currentOrd.calculatedSubtotal : (currentOrd.totalAmount > 0 ? currentOrd.totalAmount : 0.0);

                final gstAmount = currentOrd.getGstAmount(gstRate);
                final gstPctStr = (originalTotal > 0 && gstAmount > 0)
                    ? (gstAmount / originalTotal * 100).round().toString()
                    : (gstRate * 100).toStringAsFixed((gstRate * 100) % 1 == 0 ? 0 : 1);

                final finalBill = originalTotal + gstAmount;
                final tip = currentOrd.tipAmount;

                final customerPaid = currentOrd.totalAmount > 0 ? currentOrd.totalAmount : (finalBill + tip);
                final restaurantRevenue = finalBill;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Payment Financial Breakdown:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F2A1D),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Total Bill
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total Bill:',
                                style: TextStyle(color: Color(0xFF475569), fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              Text(
                                '₹${originalTotal.toStringAsFixed(0)}',
                                style: const TextStyle(color: Color(0xFF334155), fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),

                          // 2. GST
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'GST ($gstPctStr%):',
                                style: const TextStyle(color: Color(0xFF475569), fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              Text(
                                '+₹${gstAmount.toStringAsFixed(0)}',
                                style: const TextStyle(color: Color(0xFF475569), fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),

                          // 5. Final Bill (Food + GST)
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            decoration: const BoxDecoration(
                              border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Final Bill : ',
                                  style: TextStyle(color: Color(0xFF0F2A1D), fontSize: 14, fontWeight: FontWeight.w900),
                                ),
                                Text(
                                  '₹${finalBill.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Color(0xFF0F2A1D), fontSize: 15, fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                          ),

                          // 6. Customer Tip (if tip > 0)
                          if (tip > 0) ...[
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Customer Tip:',
                                  style: TextStyle(color: Color(0xFFEA580C), fontSize: 14, fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  '+₹${tip.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Color(0xFFEA580C), fontSize: 15, fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 12),
                          const Divider(height: 1, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 12),

                          // 6. Customer Paid (Only shown after payment is completed)
                          if (currentOrd.isPaid) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Customer Paid:',
                                  style: TextStyle(color: Color(0xFF15803D), fontSize: 16, fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  '₹${customerPaid.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: Color(0xFF15803D),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Divider(height: 1, color: Color(0xFFE2E8F0)),
                            const SizedBox(height: 12),
                          ],

                          // 7. Payment Method
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Payment Method:',
                                style: TextStyle(color: Color(0xFF475569), fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                currentOrd.paymentMethod.isNotEmpty ? currentOrd.paymentMethod.toUpperCase() : 'CASH',
                                style: const TextStyle(color: Color(0xFF0F2A1D), fontSize: 14, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),

                          const SizedBox(height: 10),

                          // 8. Payment Status
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Payment Status:',
                                style: TextStyle(color: Color(0xFF15803D), fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              Text(
                                currentOrd.isPaid ? 'Paid' : (currentOrd.isBillGenerated ? 'Awaiting Payment' : 'Pending'),
                                style: TextStyle(
                                  color: currentOrd.isPaid ? const Color(0xFF15803D) : const Color(0xFF2563EB),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),

                          // 9. Revenue details (if tip exists)
                          if (tip > 0) ...[
                            const SizedBox(height: 12),
                            const Divider(height: 1, color: Color(0xFFE2E8F0)),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Restaurant Revenue:',
                                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  '₹${restaurantRevenue.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Color(0xFF0F2A1D), fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Tip (Excluded from Revenue):',
                                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  '₹${tip.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Color(0xFFEA580C), fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),

            // Requirement 4: Bottom Delivery & Lifecycle Action Buttons
            if (!currentOrd.isAcceptedByWaiter && !currentOrd.isServed && !currentOrd.isPaid) ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Accept Order',
                  icon: Icons.check_circle_outline,
                  isLoading: _isActionLoading,
                  onPressed: () async {
                    setState(() => _isActionLoading = true);
                    await ordersProvider.acceptOrder(currentOrd.id, waiterId, waiterName);
                    setState(() => _isActionLoading = false);
                  },
                ),
              ),
            ] else if (currentOrd.canGenerateBill) ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Generate Bill',
                  icon: Icons.receipt_long,
                  isLoading: _isActionLoading,
                  backgroundColor: AppColors.darkGreen,
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() => _isActionLoading = true);
                    final success = await ordersProvider.generateBill(currentOrd.id);
                    setState(() => _isActionLoading = false);
                    if (success && mounted) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('✓ Bill Generated for Table ${currentOrd.table}! Waiting for customer payment.'),
                          backgroundColor: AppColors.accentGreen,
                        ),
                      );
                    }
                  },
                ),
              ),
            ] else if (readyItemsList.isNotEmpty) ...[
              // Requirement 4: Deliver Selected Button
              Builder(
                builder: (context) {
                  final selectedReadyCount = readyItemsList
                      .where((i) => _selectedDeliverItems.contains(i.id.isNotEmpty ? i.id : i.name) || _selectedDeliverItems.contains(i.name))
                      .length;

                  final selectedReadyKeys = <String>[];
                  for (var i in readyItemsList) {
                    final k = i.id.isNotEmpty ? i.id : i.name;
                    if (k.isNotEmpty && (_selectedDeliverItems.contains(k) || _selectedDeliverItems.contains(i.name))) {
                      if (i.id.isNotEmpty) selectedReadyKeys.add(i.id);
                      if (i.name.isNotEmpty) selectedReadyKeys.add(i.name);
                    }
                  }

                  return SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      text: selectedReadyCount > 0
                          ? 'Deliver Selected ($selectedReadyCount)'
                          : 'Select Ready Items to Deliver',
                      icon: Icons.restaurant,
                      backgroundColor: AppColors.accentGreen,
                      isLoading: _isActionLoading,
                      onPressed: (selectedReadyCount == 0 || _isActionLoading)
                          ? null
                          : () async {
                              final messenger = ScaffoldMessenger.of(context);
                              setState(() => _isActionLoading = true);
                              final success = await ordersProvider.deliverSelectedItems(
                                currentOrd.id,
                                selectedReadyKeys,
                                waiterId,
                                waiterName,
                              );
                              _selectedDeliverItems.clear();
                              setState(() => _isActionLoading = false);

                              if (success && mounted) {
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('✓ Selected ready dish(es) marked as Delivered to table!'),
                                    backgroundColor: AppColors.accentGreen,
                                  ),
                                );
                              }
                            },
                    ),
                  );
                },
              ),
            ] else if (currentOrd.pendingItemsCount > 0) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFCD34D)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.soup_kitchen_rounded, color: Color(0xFFD97706), size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Waiting for Kitchen (${currentOrd.pendingItemsCount} Dish${currentOrd.pendingItemsCount > 1 ? 'es' : ''} Preparing)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFB45309)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Bill generation unlocks after all ready dishes are prepared & served to table.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF78350F), fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (currentOrd.isBillGenerated) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF93C5FD), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'Bill Generated',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E40AF)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Waiting for customer payment...',
                          style: TextStyle(fontSize: 13, color: Color(0xFF1D4ED8), fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Customer can now view & pay bill online or pay at counter.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF3B82F6), fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (currentOrd.canGenerateBill) ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Generate Bill',
                  icon: Icons.receipt_long,
                  isLoading: _isActionLoading,
                  backgroundColor: AppColors.darkGreen,
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() => _isActionLoading = true);
                    final success = await ordersProvider.generateBill(currentOrd.id);
                    setState(() => _isActionLoading = false);
                    if (success && mounted) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('✓ Bill Generated for Table ${currentOrd.table}! Waiting for customer payment.'),
                          backgroundColor: AppColors.accentGreen,
                        ),
                      );
                    }
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
