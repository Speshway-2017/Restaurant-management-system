import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../dashboard/waiter_dashboard_screen.dart';
import '../tables/my_tables_screen.dart';
import '../orders/waiter_orders_screen.dart';
import '../alerts/alerts_screen.dart';
import '../profile/waiter_profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshData();
    });
  }

  void _refreshData() {
    Provider.of<TablesProvider>(context, listen: false).fetchTables();
    Provider.of<OrdersProvider>(context, listen: false).fetchOrders();
  }

  void _switchTab(int index) {
    setState(() {
      _currentIndex = index;
    });
    _refreshData();
  }

  @override
  Widget build(BuildContext context) {
    final ordersProvider = Provider.of<OrdersProvider>(context);
    final activeAlertsCount = ordersProvider.assistanceRequests
        .where((a) => a.status.toUpperCase() != 'RESOLVED')
        .length;

    final pages = [
      WaiterDashboardScreen(onNavigateTab: _switchTab),
      const WaiterOrdersScreen(),
      const MyTablesScreen(),
      const AlertsScreen(),
      const WaiterProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF2B150E),
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF2B150E), // Dark Chocolate Coffee Brown
          border: Border(top: BorderSide(color: Color(0xFF3D1F16), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _switchTab,
          type: BottomNavigationBarType.fixed,
          backgroundColor: const Color(0xFF2B150E),
          selectedItemColor: const Color(0xFFE87524), // Terracotta Orange Accent
          unselectedItemColor: const Color(0xFFA18D86), // Muted Cream Warm Gray
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
          elevation: 0,
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.soup_kitchen_outlined),
              activeIcon: Icon(Icons.soup_kitchen_rounded),
              label: 'Orders',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.table_restaurant_outlined),
              activeIcon: Icon(Icons.table_restaurant_rounded),
              label: 'Tables',
            ),
            BottomNavigationBarItem(
              icon: Stack(
                children: [
                  const Icon(Icons.notifications_none_outlined),
                  if (activeAlertsCount > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                      ),
                    ),
                ],
              ),
              activeIcon: Stack(
                children: [
                  const Icon(Icons.notifications_rounded),
                  if (activeAlertsCount > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                      ),
                    ),
                ],
              ),
              label: 'Alerts',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
