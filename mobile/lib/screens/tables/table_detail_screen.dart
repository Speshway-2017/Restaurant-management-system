import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/table_model.dart';
import '../../models/order_model.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../core/constants/app_colors.dart';
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
                            fontWeight: FontWeight.w900,
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
                            '${table.section} • Capacity: ${table.seats} Persons',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    StatusBadgeWidget(status: table.status),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Active Order Section
            const Text(
              'Active Table Order',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),

            if (activeOrder == null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.restaurant_outlined, size: 40, color: AppColors.textSecondary),
                    SizedBox(height: 8),
                    Text(
                      'No active orders for this table.',
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Customers can scan Table QR code to place orders.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Order #${activeOrder.orderId}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.darkGreen,
                            ),
                          ),
                          Text(
                            'Customer: ${activeOrder.customer}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),

                      // Order Items List
                      ...activeOrder.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Text(
                                '${item.quantity}x ',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accentGreen),
                              ),
                              Expanded(
                                child: Text(
                                  item.name,
                                  style: TextStyle(
                                    decoration: item.isCancelled ? TextDecoration.lineThrough : null,
                                    color: item.isCancelled ? AppColors.cancelledText : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              Text(
                                '₹${(item.price * item.quantity).toStringAsFixed(0)}',
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
                            '₹${activeOrder.totalAmount.toStringAsFixed(0)}',
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
