import 'package:flutter/material.dart';

class FlavoraBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final int activeAlertsCount;

  const FlavoraBottomNavigationBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.activeAlertsCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    final navItems = [
      {'icon': Icons.home_outlined, 'activeIcon': Icons.home_rounded, 'label': 'Home'},
      {'icon': Icons.grid_view_outlined, 'activeIcon': Icons.grid_view_rounded, 'label': 'Tables'},
      {'icon': Icons.receipt_long_outlined, 'activeIcon': Icons.receipt_long_rounded, 'label': 'Orders'},
      {'icon': Icons.notifications_none_outlined, 'activeIcon': Icons.notifications_rounded, 'label': 'Alerts'},
      {'icon': Icons.person_outline_rounded, 'activeIcon': Icons.person_rounded, 'label': 'Profile'},
    ];

    return Container(
      color: Colors.transparent,
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        bottom: bottomInset > 0 ? bottomInset + 4 : 12,
        top: 6,
      ),
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A), // Dark futuristic glass background
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: const Color(0xFF334155).withValues(alpha: 0.6),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(navItems.length, (idx) {
            final isSelected = currentIndex == idx;
            final item = navItems[idx];
            final icon = item['icon'] as IconData;
            final activeIcon = item['activeIcon'] as IconData;
            final label = item['label'] as String;
            final badge = idx == 3 ? activeAlertsCount : 0;

            return _buildNavItem(
              index: idx,
              isSelected: isSelected,
              icon: icon,
              activeIcon: activeIcon,
              label: label,
              badgeCount: badge,
            );
          }),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required bool isSelected,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    int badgeCount = 0,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => onTap(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 12 : 8,
          vertical: 4,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF1E293B) // Dark glass active pill background
              : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
          border: isSelected
              ? Border.all(
                  color: const Color(0xFF475569).withValues(alpha: 0.5),
                  width: 1,
                )
              : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Icon Container (with Rainbow Spectrum Halo Ring when Active)
            Stack(
              clipBehavior: Clip.none,
              children: [
                if (isSelected) ...[
                  // Rainbow Chromatic Spectrum Halo Ring
                  Container(
                    padding: const EdgeInsets.all(2.2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const SweepGradient(
                        colors: [
                          Color(0xFFFF0055),
                          Color(0xFFFFB800),
                          Color(0xFF00F2FE),
                          Color(0xFF7928CA),
                          Color(0xFF00DF72),
                          Color(0xFFFF0055),
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF00F2FE).withValues(alpha: 0.6),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFF3F3F46), Color(0xFF18181B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Icon(
                        activeIcon,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ] else ...[
                  Icon(
                    icon,
                    size: 20,
                    color: const Color(0xFF94A3B8),
                  ),
                ],

                // Badge Indicator for Alerts Tab
                if (badgeCount > 0)
                  Positioned(
                    right: isSelected ? -2 : -4,
                    top: isSelected ? -2 : -4,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 8,
                        minHeight: 8,
                      ),
                    ),
                  ),
              ],
            ),

            // Active Tab Text Label (Expanded horizontally next to the rainbow ring icon)
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 4),
            ],
          ],
        ),
      ),
    );
  }
}
