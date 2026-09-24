import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/order_card_widget.dart';
import 'order_detail_screen.dart';

class WaiterOrdersScreen extends StatefulWidget {
  final int initialTabIndex;

  const WaiterOrdersScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<WaiterOrdersScreen> createState() => _WaiterOrdersScreenState();
}

class _WaiterOrdersScreenState extends State<WaiterOrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedActionOrderId = '';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 4),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<OrderModel> _filterBySearch(List<OrderModel> list) {
    if (_searchQuery.trim().isEmpty) return list;
    final q = _searchQuery.trim().toLowerCase();
    return list.where((ord) {
      final tableStr = 'table ${ord.table} t-${ord.tableNum}'.toLowerCase();
      final idStr = ord.orderId.toLowerCase();
      final custStr = ord.customer.toLowerCase();
      return tableStr.contains(q) || idStr.contains(q) || custStr.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final ordersProvider = Provider.of<OrdersProvider>(context);

    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';
    final assignedTables = user?.assignedTables ?? [];

    final myOrders = ordersProvider.getMyOrders(waiterId, waiterName, assignedTables);

    final readyOrders = myOrders.where((o) => o.isReadyToServe && !o.isServed).toList();
    final servingOrders = myOrders.where((o) => o.isServingInTransit).toList();
    final servedOrders = myOrders.where((o) => o.isServed && !o.isPaid).toList();
    final activeOrders = myOrders.where((o) => !o.isPaid && o.status != 'SERVED').toList();
    final completedOrders = myOrders.where((o) => o.isPaid || o.status.toLowerCase() == 'completed' || o.status.toLowerCase() == 'paid').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Waiter Orders & History'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(text: 'History (${completedOrders.length})'),
            Tab(text: 'Active (${activeOrders.length})'),
            Tab(text: 'Ready (${readyOrders.length})'),
            Tab(text: 'Serving (${servingOrders.length})'),
            Tab(text: 'Served (${servedOrders.length})'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: TextField(
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search by Table (T-01), Order ID, or Customer...',
                prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.textSecondary),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const Divider(height: 1),

          // Main Tabs Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOrdersList(_filterBySearch(completedOrders), waiterId, waiterName, ordersProvider, isHistory: true),
                _buildOrdersList(_filterBySearch(activeOrders), waiterId, waiterName, ordersProvider, isHistory: false),
                _buildOrdersList(_filterBySearch(readyOrders), waiterId, waiterName, ordersProvider, isHistory: false),
                _buildOrdersList(_filterBySearch(servingOrders), waiterId, waiterName, ordersProvider, isHistory: false),
                _buildOrdersList(_filterBySearch(servedOrders), waiterId, waiterName, ordersProvider, isHistory: false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList(List<OrderModel> list, String waiterId, String waiterName, OrdersProvider provider, {required bool isHistory}) {
    Widget listWidget;

    if (list.isEmpty) {
      listWidget = SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          alignment: Alignment.center,
          padding: const EdgeInsets.all(32.0),
          height: 380,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isHistory ? Icons.history_toggle_off_rounded : Icons.assignment_turned_in_outlined,
                size: 56,
                color: AppColors.textSecondary,
              ),
              const SizedBox(height: 12),
              Text(
                isHistory ? 'No Order History Found' : 'No Active Orders in this Status',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                isHistory
                    ? 'Completed and paid orders across tables will appear here.'
                    : 'Orders requiring waiter action will show up automatically.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    } else {
      listWidget = ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final ord = list[index];
          final isLoading = _selectedActionOrderId == ord.id;

          return OrderCardWidget(
            order: ord,
            isActionLoading: isLoading,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => OrderDetailScreen(order: ord)),
              );
            },
            onAcceptOrder: () async {
              setState(() => _selectedActionOrderId = ord.id);
              await provider.acceptOrder(ord.id, waiterId, waiterName);
              if (mounted) setState(() => _selectedActionOrderId = '');
            },
            onStartServing: () async {
              setState(() => _selectedActionOrderId = ord.id);
              await provider.updateServingStatus(ord.id, 'SERVING', waiterId, waiterName);
              if (mounted) setState(() => _selectedActionOrderId = '');
            },
            onMarkServed: () async {
              setState(() => _selectedActionOrderId = ord.id);
              await provider.updateServingStatus(ord.id, 'SERVED', waiterId, waiterName);
              if (mounted) setState(() => _selectedActionOrderId = '');
            },
            onBillingPayment: () async {
              final messenger = ScaffoldMessenger.of(context);
              setState(() => _selectedActionOrderId = ord.id);
              final success = await provider.generateBill(ord.id);
              if (mounted) {
                setState(() => _selectedActionOrderId = '');
                if (success) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text('✓ Bill Generated for Table ${ord.table}! Waiting for customer payment.'),
                      backgroundColor: AppColors.accentGreen,
                    ),
                  );
                }
              }
            },
          );
        },
      );
    }

    return RefreshIndicator(
      color: AppColors.darkGreen,
      onRefresh: () => provider.fetchOrders(),
      child: listWidget,
    );
  }
}
