import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/table_model.dart';
import '../../models/order_model.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/guest_guard.dart';
import '../../widgets/status_badge_widget.dart';
import '../../widgets/custom_button.dart';
import '../billing/billing_payment_screen.dart';

class TableDetailScreen extends StatelessWidget {
  final TableModel table;

  const TableDetailScreen({super.key, required this.table});

  @override
  Widget build(BuildContext context) {
    final ordersProvider = Provider.of<OrdersProvider>(context);
    final tablesProvider = Provider.of<TablesProvider>(context);

    // Find active order for this table
    final cleanNum = table.number.replaceAll(RegExp(r'[^0-9]'), '');
    OrderModel? matchedOrder;
    for (var o in ordersProvider.orders) {
      final oNum = o.table.replaceAll(RegExp(r'[^0-9]'), '');
      if ((oNum.isNotEmpty && cleanNum.isNotEmpty && int.tryParse(oNum) == int.tryParse(cleanNum) || o.table == table.number) && !o.isPaid) {
        matchedOrder = o;
        break;
      }
    }
    final activeOrder = matchedOrder;

    return Scaffold(
      appBar: AppBar(
        title: Text('Table ${table.number} Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Table Status Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: AppColors.darkGreen,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          cleanNum,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Table ${table.number}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Capacity: ${table.capacity} Persons â€¢ ${table.floor}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          StatusBadgeWidget(status: table.status),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Active Order Summary for this Table
            if (activeOrder != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'ACTIVE ORDER SUMMARY',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textSecondary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          StatusBadgeWidget(status: activeOrder.status),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Order #${activeOrder.orderId} â€¢ Customer: ${activeOrder.customer}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const Divider(height: 20),

                      // Order Items List
                      ...activeOrder.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: const BoxDecoration(
                                  color: AppColors.lightGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '${item.quantity}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.accentGreen,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  item.name,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Text(
                                'â‚¹${(item.price * item.quantity).toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 20),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          Text(
                            'â‚¹${activeOrder.totalAmount.toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.darkGreen),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Action Button
                      if (activeOrder.isServed && !activeOrder.isPaid) ...[
                        SizedBox(
                          width: double.infinity,
                          child: CustomButton(
                            text: 'Process Payment & Complete Bill',
                            icon: Icons.receipt_long,
                            onPressed: () {
                              if (GuestGuard.checkGuestRestriction(context, action: 'process payment & complete bill')) return;
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => BillingPaymentScreen(order: activeOrder)),
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Table Management Actions
            if (table.status == 'Cleaning') ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Mark Table Available',
                  icon: Icons.cleaning_services,
                  backgroundColor: AppColors.accentGreen,
                  onPressed: () async {
                    if (GuestGuard.checkGuestRestriction(context, action: 'update table status')) return;
                    await tablesProvider.updateStatus(table.id, 'Available');
                    if (context.mounted) Navigator.pop(context);
                  },
                ),
              ),
            ] else if (table.status == 'Occupied' || table.status == 'Billing') ...[
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Vacate Table & Mark Cleaning',
                  icon: Icons.cleaning_services_outlined,
                  backgroundColor: AppColors.warmOrange,
                  onPressed: () async {
                    if (GuestGuard.checkGuestRestriction(context, action: 'vacate table')) return;
                    await tablesProvider.vacateTable(table.number);
                    if (context.mounted) Navigator.pop(context);
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
