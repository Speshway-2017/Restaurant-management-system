import 'package:flutter/material.dart';
import '../models/table_model.dart';
import '../core/constants/app_colors.dart';
import 'status_badge_widget.dart';

class TableCardWidget extends StatelessWidget {
  final TableModel table;
  final VoidCallback onTap;

  const TableCardWidget({
    super.key,
    required this.table,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Table Avatar Badge
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.darkGreen,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    table.number.replaceAll(RegExp(r'[^0-9]'), ''),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              
              // Table Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Table ${table.number}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (table.mergedWith.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.amberBadgeBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '+${table.mergedWith.join(', ')}',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppColors.amberBadgeText,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${table.section} • ${table.seats} Seats',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (table.currentOrder.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Order #${table.currentOrder}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.accentGreen,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Status Badge
              StatusBadgeWidget(status: table.status),
            ],
          ),
        ),
      ),
    );
  }
}
