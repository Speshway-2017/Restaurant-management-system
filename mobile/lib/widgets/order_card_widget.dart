import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../core/constants/app_colors.dart';
import 'status_badge_widget.dart';
import 'custom_button.dart';

class OrderCardWidget extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onTap;
  final VoidCallback? onAcceptOrder;
  final VoidCallback? onStartServing;
  final VoidCallback? onMarkServed;
  final VoidCallback? onBillingPayment;
  final bool isActionLoading;

  const OrderCardWidget({
    super.key,
    required this.order,
    required this.onTap,
    this.onAcceptOrder,
    this.onStartServing,
    this.onMarkServed,
    this.onBillingPayment,
    this.isActionLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order Header: Table & Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.darkGreen,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Table ${order.table}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '#${order.orderId}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  StatusBadgeWidget(status: order.isPaid ? 'Completed' : (order.isBillGenerated ? 'Bill Generated' : (order.isServed ? 'Served' : (order.isServingInTransit ? 'Serving' : (order.isReadyToServe ? 'Ready' : order.status))))),
                ],
              ),
              const SizedBox(height: 12),

              // Customer & Items Count
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 16, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        order.customer,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${order.items.length} Items • ₹${(order.totalAmount > 0 ? order.totalAmount : order.netTotal).toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.darkGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Dish Items Preview
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: order.items.take(3).map((item) {
                    final bool isReady = (item.isReady || item.status == 'READY') && !item.isDelivered && item.status != 'SERVED' && item.status != 'DELIVERED';
                    final bool isServed = item.isDelivered || item.status == 'SERVED' || item.status == 'DELIVERED';

                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 2),
                      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                      decoration: BoxDecoration(
                        color: isReady ? const Color(0xFFDCFCE7) : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        border: isReady ? Border.all(color: const Color(0xFF86EFAC), width: 1) : null,
                      ),
                      child: Row(
                        children: [
                          Text(
                            '${item.quantity}x ',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isReady ? const Color(0xFF166534) : AppColors.accentGreen,
                            ),
                          ),
                          Expanded(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: isReady ? FontWeight.bold : FontWeight.normal,
                                      color: item.isCancelled ? AppColors.cancelledText : (isReady ? const Color(0xFF166534) : AppColors.textPrimary),
                                      decoration: item.isCancelled ? TextDecoration.lineThrough : null,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                if (item.isCancelled)
                                  const Text(' (Cancelled)', style: TextStyle(fontSize: 10, color: AppColors.cancelledText))
                                else if (isServed)
                                  const Text(' • ✅ Served', style: TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.bold))
                                else if (isReady)
                                  const Text(' • 🟢 READY TO SERVE', style: TextStyle(fontSize: 10, color: Color(0xFF166534), fontWeight: FontWeight.bold))
                                else
                                  const Text(' • ⏳ Cooking', style: TextStyle(fontSize: 10, color: Color(0xFFD97706), fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Text(
                            '₹${(item.price * item.quantity).toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isReady ? const Color(0xFF166534) : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 12),

              // Dynamic Waiter Action Button
              if (!order.isAcceptedByWaiter && !order.isServed && !order.isPaid) ...[
                // STEP 1: ACCEPT ORDER
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Accept Order',
                    icon: Icons.check_circle_outline,
                    isLoading: isActionLoading,
                    backgroundColor: AppColors.accentGreen,
                    onPressed: onAcceptOrder,
                  ),
                ),
              ] else if (order.canGenerateBill) ...[
                // STEP 2: ALL DISHES SERVED -> GENERATE BILL UNLOCKED
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Generate Bill',
                    icon: Icons.receipt_long,
                    isLoading: isActionLoading,
                    backgroundColor: AppColors.darkGreen,
                    onPressed: onBillingPayment,
                  ),
                ),
              ] else if (order.readyItemsCount > 0) ...[
                // STEP 3: SERVE READY DISHES
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Serve Ready Dishes (${order.readyItemsCount} Ready)',
                    icon: Icons.restaurant,
                    isLoading: isActionLoading,
                    backgroundColor: AppColors.accentGreen,
                    onPressed: onMarkServed ?? onStartServing,
                  ),
                ),
              ] else if (order.pendingItemsCount > 0) ...[
                // STEP 4: WAITING FOR KITCHEN / OTHER DISHES TO BE PREPARED
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFCD34D)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.soup_kitchen_rounded, color: Color(0xFFD97706), size: 16),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          'Waiting for Kitchen (${order.pendingItemsCount} Dish${order.pendingItemsCount > 1 ? 'es' : ''} Preparing)',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFB45309),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ] else if (order.isServingInTransit && !order.isServed) ...[
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Mark as Served at Table',
                    icon: Icons.done_all,
                    isLoading: isActionLoading,
                    backgroundColor: AppColors.darkGreen,
                    onPressed: onMarkServed,
                  ),
                ),
              ] else if (order.isServed && !order.isPaid && order.status != 'Bill Generated') ...[
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Generate Bill',
                    icon: Icons.receipt_long,
                    isLoading: isActionLoading,
                    backgroundColor: AppColors.darkGreen,
                    onPressed: onBillingPayment,
                  ),
                ),
              ] else if (order.status == 'Bill Generated' || order.paymentStatus == 'Awaiting Payment') ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.hourglass_top_rounded, color: Color(0xFFD97706), size: 16),
                      SizedBox(width: 6),
                      Text(
                        'Bill Generated • Awaiting Customer Payment',
                        style: TextStyle(
                          color: Color(0xFFD97706),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
