import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/flavora_bottom_navigation_bar.dart';
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
      const MyTablesScreen(),
      const WaiterOrdersScreen(),
      const AlertsScreen(),
      const WaiterProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: FlavoraBottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _switchTab,
        activeAlertsCount: activeAlertsCount,
      ),
    );
  }
}
