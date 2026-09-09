import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class StatusBadgeWidget extends StatelessWidget {
  final String status;

  const StatusBadgeWidget({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg = AppColors.availableBg;
    Color text = AppColors.availableText;
    Color border = AppColors.availableBorder;
    String label = status.toUpperCase();

    final sUpper = status.toUpperCase();

    if (sUpper.contains('CLEANING')) {
      bg = AppColors.cleaningBg;
      text = AppColors.cleaningText;
      border = AppColors.cleaningBorder;
      label = '🧹 CLEANING';
    } else if (sUpper.contains('BILL') || sUpper.contains('AWAITING PAYMENT')) {
      bg = AppColors.billingBg;
      text = AppColors.billingText;
      border = AppColors.billingBorder;
      label = '🧾 BILLING';
    } else if (sUpper.contains('READY')) {
      bg = AppColors.readyBg;
      text = AppColors.readyText;
      border = AppColors.readyBorder;
      label = '✨ READY';
    } else if (sUpper.contains('SERVING') || sUpper.contains('IN_TRANSIT')) {
      bg = AppColors.servingBg;
      text = AppColors.servingText;
      border = AppColors.servingBorder;
      label = '🏃 SERVING';
    } else if (sUpper.contains('SERVED') || sUpper.contains('COMPLETED') || sUpper.contains('PAID')) {
      bg = AppColors.availableBg;
      text = AppColors.availableText;
      border = AppColors.availableBorder;
      label = '✅ SERVED';
    } else if (sUpper.contains('OCCUPIED') || sUpper.contains('IN PROGRESS') || sUpper.contains('PREPARING') || sUpper.contains('COOKING')) {
      bg = AppColors.occupiedBg;
      text = AppColors.occupiedText;
      border = AppColors.occupiedBorder;
      label = '⏳ IN PROGRESS';
    } else if (sUpper.contains('CANCEL')) {
      bg = AppColors.cancelledBg;
      text = AppColors.cancelledText;
      border = AppColors.cancelledBorder;
      label = '❌ CANCELLED';
    } else {
      bg = AppColors.availableBg;
      text = AppColors.availableText;
      border = AppColors.availableBorder;
      label = '🟢 AVAILABLE';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
