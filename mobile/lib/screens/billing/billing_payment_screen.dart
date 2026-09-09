import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order_model.dart';
import '../../providers/orders_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/custom_button.dart';

class BillingPaymentScreen extends StatefulWidget {
  final OrderModel order;

  const BillingPaymentScreen({super.key, required this.order});

  @override
  State<BillingPaymentScreen> createState() => _BillingPaymentScreenState();
}

class _BillingPaymentScreenState extends State<BillingPaymentScreen> {
  String _selectedPaymentMethod = 'UPI'; // UPI, Card, Cash
  double _tipAmount = 0.0;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final ordersProvider = Provider.of<OrdersProvider>(context);
    final gstRate = ordersProvider.gstRate;
    final gstPctStr = (gstRate * 100).toStringAsFixed((gstRate * 100) % 1 == 0 ? 0 : 1);
    final subtotal = widget.order.calculatedSubtotal;
    final gst = widget.order.getGstAmount(gstRate);
    final discount = widget.order.discountAmount;
    final totalPayable = (subtotal - discount) + gst;
    final grandTotalWithTip = totalPayable + _tipAmount;

    return Scaffold(
      appBar: AppBar(
        title: Text('Table ${widget.order.table} Settlement'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bill Invoice Breakdown Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TAX INVOICE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                        Text('Table ${widget.order.table}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accentGreen)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('Order #${widget.order.orderId} • Customer: ${widget.order.customer}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const Divider(height: 24),

                    // Items list
                    ...widget.order.items.where((it) => !it.isCancelled).map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Row(
                          children: [
                            Text('${item.quantity}x ', style: const TextStyle(fontWeight: FontWeight.bold)),
                            Expanded(child: Text(item.name)),
                            Text('₹${(item.price * item.quantity).toStringAsFixed(0)}'),
                          ],
                        ),
                      );
                    }),
                    const Divider(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Food Subtotal'),
                        Text('₹${subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    if (discount > 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Coupon Discount (${widget.order.couponCode})', style: const TextStyle(color: AppColors.accentGreen)),
                          Text('-₹${discount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accentGreen)),
                        ],
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('GST ($gstPctStr%)', style: const TextStyle(color: AppColors.textSecondary)),
                        Text('₹${gst.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    if (_tipAmount > 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Customer Tip (Excluded from Revenue)', style: TextStyle(color: AppColors.warmOrange, fontWeight: FontWeight.bold)),
                          Text('+₹${_tipAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warmOrange)),
                        ],
                      ),
                    ],
                    const Divider(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Grand Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('₹${grandTotalWithTip.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.darkGreen)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Tip Option Section
            const Text('Add Optional Staff Tip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 10),
            Row(
              children: [0, 20, 50, 100].map((tipVal) {
                final isSel = _tipAmount == tipVal.toDouble();
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        backgroundColor: isSel ? AppColors.darkGreen : Colors.white,
                        foregroundColor: isSel ? Colors.white : AppColors.darkGreen,
                        side: BorderSide(color: isSel ? AppColors.darkGreen : AppColors.border),
                      ),
                      onPressed: () => setState(() => _tipAmount = tipVal.toDouble()),
                      child: Text(tipVal == 0 ? 'No Tip' : '₹$tipVal'),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Payment Method Selector
            const Text('Select Payment Mode', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 10),

            _buildPaymentMethodOption(
              title: 'UPI / Dynamic QR Code',
              subtitle: 'Google Pay, PhonePe, Paytm',
              icon: Icons.qr_code_2,
              value: 'UPI',
            ),
            const SizedBox(height: 8),
            _buildPaymentMethodOption(
              title: 'Card Payment (POS Terminal)',
              subtitle: 'Visa, Mastercard, RuPay',
              icon: Icons.credit_card,
              value: 'Card',
            ),
            const SizedBox(height: 8),
            _buildPaymentMethodOption(
              title: 'Cash Payment',
              subtitle: 'Collect cash at table',
              icon: Icons.payments_outlined,
              value: 'Cash',
            ),
            const SizedBox(height: 24),

            // Submit Payment Button
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: 'Confirm ₹${grandTotalWithTip.toStringAsFixed(0)} Payment Received',
                icon: Icons.check_circle,
                isLoading: _isProcessing,
                backgroundColor: AppColors.accentGreen,
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(context);
                  setState(() => _isProcessing = true);
                  final provider = Provider.of<OrdersProvider>(context, listen: false);
                  final success = await provider.completePayment(
                    widget.order.id,
                    widget.order.table,
                    _selectedPaymentMethod,
                    grandTotalWithTip,
                    _tipAmount,
                  );
                  setState(() => _isProcessing = false);

                  if (success && mounted) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text('✓ Payment of ₹${grandTotalWithTip.toStringAsFixed(0)} confirmed! Table ${widget.order.table} marked CLEANING.'),
                        backgroundColor: AppColors.accentGreen,
                      ),
                    );
                    navigator.pop();
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required String value,
  }) {
    final isSelected = _selectedPaymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.lightGreen : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.accentGreen : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? AppColors.accentGreen : AppColors.textSecondary, size: 24),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isSelected ? AppColors.darkGreen : AppColors.textPrimary)),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.accentGreen : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}
