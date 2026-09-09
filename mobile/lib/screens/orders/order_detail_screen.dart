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
  final _cancelReasonController = TextEditingController();
  bool _isActionLoading = false;

  @override
  void dispose() {
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

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final ordersProvider = Provider.of<OrdersProvider>(context);

    // Refresh current order state
    final currentOrd = ordersProvider.orders.firstWhere(
      (o) => o.id == widget.order.id || o.orderId == widget.order.orderId,
      orElse: () => widget.order,
    );

    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';

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
                        StatusBadgeWidget(status: currentOrd.isServed ? 'Served' : (currentOrd.isServingInTransit ? 'Serving' : (currentOrd.isReadyToServe ? 'Ready' : currentOrd.status))),
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
            const SizedBox(height: 20),

            // Order Items & Cancellation Selection
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Order Items',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                if (currentOrd.isAcceptedByWaiter && !currentOrd.isServed) ...[
                  TextButton.icon(
                    onPressed: _showCancelDialog,
                    icon: const Icon(Icons.cancel_outlined, size: 16, color: AppColors.cancelledText),
                    label: const Text('Cancel Selected', style: TextStyle(color: AppColors.cancelledText, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: currentOrd.items.map((item) {
                    final isSel = _selectedCancelItems.contains(item.name);
                    return InkWell(
                      onTap: (currentOrd.isAcceptedByWaiter && !currentOrd.isServed && !item.isCancelled)
                          ? () {
                              setState(() {
                                if (isSel) {
                                  _selectedCancelItems.remove(item.name);
                                } else {
                                  _selectedCancelItems.add(item.name);
                                }
                              });
                            }
                          : null,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            if (currentOrd.isAcceptedByWaiter && !currentOrd.isServed && !item.isCancelled) ...[
                              Checkbox(
                                value: isSel,
                                activeColor: AppColors.cancelledText,
                                onChanged: (val) {
                                  setState(() {
                                    if (val == true) {
                                      _selectedCancelItems.add(item.name);
                                    } else {
                                      _selectedCancelItems.remove(item.name);
                                    }
                                  });
                                },
                              ),
                            ],
                            Text('${item.quantity}x ', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accentGreen)),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      decoration: item.isCancelled ? TextDecoration.lineThrough : null,
                                      color: item.isCancelled ? AppColors.cancelledText : AppColors.textPrimary,
                                    ),
                                  ),
                                  if (item.isCancelled)
                                    const Text('CANCELLED', style: TextStyle(fontSize: 10, color: AppColors.cancelledText, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            Text('₹${(item.price * item.quantity).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Summary Breakdown
            Builder(
              builder: (context) {
                final gstRate = ordersProvider.gstRate;
                final gstPctStr = (gstRate * 100).toStringAsFixed((gstRate * 100) % 1 == 0 ? 0 : 1);
                final dynamicGstAmount = currentOrd.getGstAmount(gstRate);
                final dynamicNetTotal = currentOrd.getNetTotal(gstRate);

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal', style: TextStyle(color: AppColors.textSecondary)),
                            Text('₹${currentOrd.calculatedSubtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('GST ($gstPctStr%)', style: const TextStyle(color: AppColors.textSecondary)),
                            Text('₹${dynamicGstAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text('₹${dynamicNetTotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.darkGreen)),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Lifecycle Buttons
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
            ] else if (currentOrd.isAcceptedByWaiter && !currentOrd.isServingInTransit && !currentOrd.isServed) ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Start Serving (In Transit)',
                  icon: Icons.directions_run,
                  backgroundColor: AppColors.warmOrange,
                  isLoading: _isActionLoading,
                  onPressed: () async {
                    setState(() => _isActionLoading = true);
                    await ordersProvider.updateServingStatus(currentOrd.id, 'SERVING', waiterId, waiterName);
                    setState(() => _isActionLoading = false);
                  },
                ),
              ),
            ] else if (currentOrd.isServingInTransit && !currentOrd.isServed) ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Mark as Served at Table',
                  icon: Icons.done_all,
                  backgroundColor: AppColors.darkGreen,
                  isLoading: _isActionLoading,
                  onPressed: () async {
                    setState(() => _isActionLoading = true);
                    await ordersProvider.updateServingStatus(currentOrd.id, 'SERVED', waiterId, waiterName);
                    setState(() => _isActionLoading = false);
                  },
                ),
              ),
            ] else if (currentOrd.isServed && !currentOrd.isPaid && currentOrd.status != 'Bill Generated') ...[
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
            ] else if (currentOrd.status == 'Bill Generated' || currentOrd.paymentStatus == 'Awaiting Payment') ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.hourglass_top_rounded, color: Color(0xFFD97706), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Bill Generated • Waiting for Customer Payment',
                      style: TextStyle(
                        color: Color(0xFFD97706),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
