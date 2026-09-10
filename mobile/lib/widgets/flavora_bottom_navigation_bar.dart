import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

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

    return Container(
      color: Colors.transparent,
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: bottomInset > 0 ? bottomInset + 4 : 14,
        top: 6,
      ),
      child: Container(
        height: 68,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: const Color(0xFFF1F5F9),
            width: 1.5,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1F0F2A1D), // Dark green subtle shadow
              blurRadius: 20,
              spreadRadius: 0,
              offset: Offset(0, 8),
            ),
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 6,
              spreadRadius: 0,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildNavItem(
              index: 0,
              icon: Icons.home_outlined,
              activeIcon: Icons.home_rounded,
              label: 'Home',
            ),
            _buildNavItem(
              index: 1,
              icon: Icons.table_restaurant_outlined,
              activeIcon: Icons.table_restaurant_rounded,
              label: 'Tables',
            ),
            _buildCenterNavItem(
              index: 2,
              icon: Icons.soup_kitchen_outlined,
              activeIcon: Icons.soup_kitchen_rounded,
              label: 'Orders',
            ),
            _buildNavItem(
              index: 3,
              icon: Icons.notifications_none_outlined,
              activeIcon: Icons.notifications_rounded,
              label: 'Alerts',
              badgeCount: activeAlertsCount,
            ),
            _buildNavItem(
              index: 4,
              icon: Icons.person_outline_rounded,
              activeIcon: Icons.person_rounded,
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    int badgeCount = 0,
  }) {
    final isSelected = currentIndex == index;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(index),
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            padding: EdgeInsets.symmetric(
              horizontal: isSelected ? 12 : 8,
              vertical: isSelected ? 6 : 6,
            ),
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(
                      0xFFDCFCE7) // Light Emerald Green background for active tab
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      transitionBuilder: (child, anim) =>
                          ScaleTransition(scale: anim, child: child),
                      child: Icon(
                        isSelected ? activeIcon : icon,
                        key: ValueKey<bool>(isSelected),
                        size: 22,
                        color: isSelected
                            ? AppColors.darkGreen
                            : const Color(0xFF64748B),
                      ),
                    ),
                    if (badgeCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444), // Crimson Red Badge
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
                const SizedBox(height: 3),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? AppColors.darkGreen
                        : const Color(0xFF64748B),
                    fontFamily: 'Inter',
                  ),
                  child: Text(label),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCenterNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = currentIndex == index;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(index),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                width: isSelected ? 44 : 40,
                height: isSelected ? 44 : 40,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.darkGreen
                      : const Color(0xD90F2A1D),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? const Color(0xFF4ADE80) : Colors.white,
                    width: isSelected ? 2 : 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isSelected
                          ? const Color(0x4D0F2A1D)
                          : const Color(0x200F2A1D),
                      blurRadius: isSelected ? 12 : 6,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: isSelected ? 22 : 20,
                  color: isSelected ? const Color(0xFF4ADE80) : Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? AppColors.darkGreen
                      : const Color(0xFF64748B),
                  fontFamily: 'Inter',
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
