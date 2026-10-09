import 'package:flutter/material.dart';

/// 1. Welcome Screen Visual Component
class WelcomeVisualWidget extends StatelessWidget {
  const WelcomeVisualWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 90,
          height: 90,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFDF8),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF0F4D3A), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F4D3A).withValues(alpha: 0.12),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/logo.png',
            fit: BoxFit.contain,
            errorBuilder: (ctx, err, stack) => const Icon(
              Icons.restaurant_outlined,
              size: 42,
              color: Color(0xFF0F4D3A),
            ),
          ),
        ),
        const SizedBox(height: 16),
        RichText(
          textAlign: TextAlign.center,
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'Flavora ',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFFF36F0A),
                ),
              ),
              TextSpan(
                text: 'Kitchen',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFF0F4D3A),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const Wrap(
          spacing: 8,
          runSpacing: 6,
          alignment: WrapAlignment.center,
          children: [
            _FeatureBadge(
              icon: Icons.flash_on_rounded,
              label: 'Fast Service',
              color: Color(0xFFF36F0A),
              bgColor: Color(0xFFFFE7D2),
            ),
            _FeatureBadge(
              icon: Icons.sync_rounded,
              label: 'Live Orders',
              color: Color(0xFF0F4D3A),
              bgColor: Color(0xFFDDEFE5),
            ),
            _FeatureBadge(
              icon: Icons.table_restaurant_rounded,
              label: 'Table Sync',
              color: Color(0xFFD97706),
              bgColor: Color(0xFFFFF0C7),
            ),
          ],
        ),
      ],
    );
  }
}

/// 2. Order Management Visual Component
class OrderManagementVisualWidget extends StatelessWidget {
  const OrderManagementVisualWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long_rounded, color: Color(0xFF0F4D3A), size: 20),
                SizedBox(width: 6),
                Text(
                  'Order #1042',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F4D3A),
                  ),
                ),
              ],
            ),
            _StatusChip(label: 'IN PROGRESS', bgColor: Color(0xFFEFF6FF), textColor: Color(0xFF1D4ED8)),
          ],
        ),
        Divider(color: Color(0xFFE7DCCF), height: 16),
        SizedBox(height: 4),
        _OrderItemRow(
          name: '2x Paneer Tikka (Spicy)',
          status: 'PREPARING',
          statusBg: Color(0xFFFFE7D2),
          statusColor: Color(0xFFC2410C),
        ),
        SizedBox(height: 8),
        _OrderItemRow(
          name: '4x Butter Naan',
          status: 'READY',
          statusBg: Color(0xFFDDEFE5),
          statusColor: Color(0xFF0F4D3A),
        ),
        SizedBox(height: 8),
        _OrderItemRow(
          name: '1x Dal Makhani',
          status: 'SERVED',
          statusBg: Color(0xFFF3E8FF),
          statusColor: Color(0xFF6B21A8),
        ),
      ],
    );
  }
}

/// 3. Faster Service Visual Component
class FasterServiceVisualWidget extends StatelessWidget {
  const FasterServiceVisualWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFDDEFE5),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF0F4D3A), width: 1.5),
          ),
          child: const Icon(
            Icons.notifications_active_rounded,
            size: 36,
            color: Color(0xFF0F4D3A),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF8EF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFFCFA5)),
          ),
          child: const Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.soup_kitchen_rounded, size: 18, color: Color(0xFFF36F0A)),
                  SizedBox(width: 6),
                  Text(
                    'Chef Marked Order Ready!',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F4D3A),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 4),
              Text(
                'Table 4 â€¢ Paneer Tikka & Butter Naan',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.timer_outlined, size: 14, color: Color(0xFFD97706)),
            SizedBox(width: 4),
            Text(
              'Zero delay service notification',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFFD97706),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// 4. Table & Customer Management Visual Component
class TableManagementVisualWidget extends StatelessWidget {
  const TableManagementVisualWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          children: [
            Expanded(
              child: _TableCardWidget(
                tableNum: 'T1',
                status: 'Available',
                badgeBg: Color(0xFFDCFCE7),
                badgeText: Color(0xFF15803D),
                icon: Icons.check_circle_outline_rounded,
              ),
            ),
            SizedBox(width: 10),
            Expanded(
              child: _TableCardWidget(
                tableNum: 'T2',
                status: 'Occupied (4)',
                badgeBg: Color(0xFFEFF6FF),
                badgeText: Color(0xFF1D4ED8),
                icon: Icons.people_outline_rounded,
              ),
            ),
          ],
        ),
        SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _TableCardWidget(
                tableNum: 'T3',
                status: 'Bill Pending',
                badgeBg: Color(0xFFFFFBEB),
                badgeText: Color(0xFFB45309),
                icon: Icons.receipt_long_rounded,
              ),
            ),
            SizedBox(width: 10),
            Expanded(
              child: _TableCardWidget(
                tableNum: 'T4',
                status: 'Assigned You',
                badgeBg: Color(0xFFDDEFE5),
                badgeText: Color(0xFF0F4D3A),
                icon: Icons.person_pin_circle_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPER SUB-WIDGETS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _FeatureBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;

  const _FeatureBadge({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color bgColor;
  final Color textColor;

  const _StatusChip({
    required this.label,
    required this.bgColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: textColor,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _OrderItemRow extends StatelessWidget {
  final String name;
  final String status;
  final Color statusBg;
  final Color statusColor;

  const _OrderItemRow({
    required this.name,
    required this.status,
    required this.statusBg,
    required this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
          ),
          _StatusChip(label: status, bgColor: statusBg, textColor: statusColor),
        ],
      ),
    );
  }
}

class _TableCardWidget extends StatelessWidget {
  final String tableNum;
  final String status;
  final Color badgeBg;
  final Color badgeText;
  final IconData icon;

  const _TableCardWidget({
    required this.tableNum,
    required this.status,
    required this.badgeBg,
    required this.badgeText,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7DCCF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                tableNum,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F4D3A),
                ),
              ),
              Icon(icon, size: 16, color: badgeText),
            ],
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: badgeText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
