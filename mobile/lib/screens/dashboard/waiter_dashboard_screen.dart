import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';
import '../../widgets/user_avatar_widget.dart';
import '../orders/order_detail_screen.dart';
import '../orders/waiter_orders_screen.dart';
import '../settings/waiter_settings_screen.dart';
import '../profile/waiter_profile_screen.dart';

class WaiterDashboardScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const WaiterDashboardScreen({super.key, this.onNavigateTab});

  @override
  State<WaiterDashboardScreen> createState() => _WaiterDashboardScreenState();
}

class _WaiterDashboardScreenState extends State<WaiterDashboardScreen> {
  Timer? _pollingTimer;
  bool _isPopupShowing = false;
  final Set<String> _notifiedOrderIds = {};
  int _selectedActiveOrderIndex = 0;

  @override
  void initState() {
    super.initState();
    // Auto-poll for new orders every 5 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _checkNewOrders();
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkNewOrders();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _checkNewOrders() async {
    final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
    await ordersProvider.fetchOrders(silent: true);

    if (_isPopupShowing || !mounted) return;

    final latestOrder = ordersProvider.latestNewOrder;
    if (latestOrder != null && !_notifiedOrderIds.contains(latestOrder.id)) {
      _notifiedOrderIds.add(latestOrder.id);
      _isPopupShowing = true;
      ordersProvider.clearLatestNewOrder();
      _showNewOrderPopup(context, latestOrder);
      return;
    }

    // Also check if any order is recently placed or ready to serve
    final unhandledOrders = ordersProvider.orders.where((o) =>
      !o.isPaid && !_notifiedOrderIds.contains(o.id) && (o.status == 'Placed' || o.isReadyToServe || o.waiterStatus == 'PENDING')
    ).toList();

    if (unhandledOrders.isNotEmpty) {
      final newest = unhandledOrders.first;
      _notifiedOrderIds.add(newest.id);
      _isPopupShowing = true;
      _showNewOrderPopup(context, newest);
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final tablesProvider = Provider.of<TablesProvider>(context);
    final ordersProvider = Provider.of<OrdersProvider>(context);

    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';
    final assignedTables = user?.assignedTables ?? [];

    final myTables = tablesProvider.getMyTables(waiterId, waiterName, assignedTables);
    final totalTablesCount = tablesProvider.tables.isNotEmpty ? tablesProvider.tables.length : 20;
    final occupiedTablesCount = myTables.isNotEmpty
        ? myTables.where((t) => t.isOccupied).length
        : tablesProvider.tables.where((t) => t.isOccupied).length;

    final myOrders = ordersProvider.getMyOrders(waiterId, waiterName, assignedTables);
    final activeOrders = myOrders.where((o) => !o.isPaid && o.status != 'SERVED').toList();
    final completedOrders = myOrders.where((o) => o.status == 'SERVED' || o.isPaid).toList();
    final pendingAcceptanceOrders = myOrders.where((o) =>
      !o.isPaid && !o.isAcceptedByWaiter && (o.isReadyToServe || o.status.toLowerCase() == 'placed' || o.waiterStatus.toUpperCase() == 'PENDING')
    ).toList();
    final acceptedOrders = myOrders.where((o) =>
      !o.isPaid && o.isAcceptedByWaiter && o.status != 'SERVED'
    ).toList();

    if (_selectedActiveOrderIndex >= acceptedOrders.length) {
      _selectedActiveOrderIndex = 0;
    }

    final firstName = (user?.name ?? 'Kiran').split(' ')[0];
    final empIdDisplay = user?.empId.isNotEmpty == true ? user!.empId : 'WTR-1024';

    return Scaffold(
      backgroundColor: const Color(0xFF2B150E), // Dark Chocolate Header Background
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 1. Top Header Bar (Dark Background)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        // Flavora Monogram Logo Box
                        Container(
                          width: 44,
                          height: 44,
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(Icons.restaurant_menu, color: Color(0xFFE87524), size: 24),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_getGreeting()}, $firstName 👋',
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${user?.role ?? "Waiter"} • ID: $empIdDisplay',
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.white.withValues(alpha: 0.75),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // User Avatar with Online Status Indicator
                  GestureDetector(
                    onTap: () => _showProfilePopup(context),
                    child: Stack(
                      children: [
                        UserAvatarWidget(
                          avatarUrl: user?.avatarUrl,
                          name: firstName,
                          radius: 22,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
                        ),
                        Positioned(
                          right: 1,
                          bottom: 1,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981), // Online Green
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF2B150E), width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 2. Main Sheet Content (Warm Cream Background with Top Curved Corners)
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF8F4EC), // Warm Cream
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                child: RefreshIndicator(
                  color: const Color(0xFFE87524),
                  onRefresh: () async {
                    await tablesProvider.fetchTables();
                    await ordersProvider.fetchOrders();
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 3. Hero Card (Pending Acceptance Card if order pending, else Active Accepted Order Card, else Floor Duty Monitor)
                        if (pendingAcceptanceOrders.isNotEmpty) ...[
                          _buildPendingAcceptanceHeroCard(context, pendingAcceptanceOrders.first, waiterId, waiterName, ordersProvider),
                        ] else if (acceptedOrders.isNotEmpty) ...[
                          _buildActiveOrderHeroCard(
                            context,
                            acceptedOrders,
                            _selectedActiveOrderIndex,
                            (idx) {
                              setState(() {
                                _selectedActiveOrderIndex = idx;
                              });
                            },
                          ),
                        ] else ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF4A2318), Color(0xFF2B150E)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF2B150E).withValues(alpha: 0.25),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.12),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                  ),
                                  child: const Icon(
                                    Icons.room_service_rounded,
                                    color: Color(0xFFFFB800), // Rich Golden Yellow
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'FLOOR & TABLES LIVE MONITOR',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFFE87524),
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Restaurant Floor Duty',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${user?.branch.isNotEmpty == true ? user!.branch : "Jubilee Hills Main Branch"} • Active Shift',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.white.withValues(alpha: 0.75),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),

                        // 4. Quick Actions Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Quick Actions',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2C140E),
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                if (widget.onNavigateTab != null) widget.onNavigateTab!(1); // Go to Orders
                              },
                              child: const Row(
                                children: [
                                  Text(
                                    'See All',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFE87524),
                                    ),
                                  ),
                                  Icon(Icons.chevron_right, size: 18, color: Color(0xFFE87524)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Quick Action Items
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: [
                              _buildQuickActionTile(
                                context,
                                icon: Icons.table_restaurant_rounded,
                                label: 'Table Status',
                                onTap: () {
                                  if (widget.onNavigateTab != null) widget.onNavigateTab!(2); // Tables
                                },
                              ),
                              const SizedBox(width: 12),
                              _buildQuickActionTile(
                                context,
                                icon: Icons.description_outlined,
                                label: 'Orders',
                                onTap: () {
                                  if (widget.onNavigateTab != null) widget.onNavigateTab!(1); // Orders
                                },
                              ),
                              const SizedBox(width: 12),
                              _buildQuickActionTile(
                                context,
                                icon: Icons.settings_outlined,
                                label: 'Settings',
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const WaiterSettingsScreen()),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // 5. Dashboard Overview Section
                        const Text(
                          'Dashboard Overview',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2C140E),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Unified White Card with 4 Metrics
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              _buildOverviewMetricItem(
                                icon: Icons.restaurant_rounded,
                                iconColor: const Color(0xFF10B981),
                                iconBg: const Color(0xFFECFDF5),
                                value: activeOrders.length.toString().padLeft(2, '0'),
                                label: 'Active Orders',
                              ),
                              _buildDivider(),
                              _buildOverviewMetricItem(
                                icon: Icons.table_restaurant_rounded,
                                iconColor: const Color(0xFF3B82F6),
                                iconBg: const Color(0xFFEFF6FF),
                                value: occupiedTablesCount.toString().padLeft(2, '0'),
                                label: 'Occupied Tables',
                              ),
                              _buildOverviewMetricItem(
                                icon: Icons.check_circle_outline_rounded,
                                iconColor: const Color(0xFFF59E0B),
                                iconBg: const Color(0xFFFEF3C7),
                                value: completedOrders.length.toString().padLeft(2, '0'),
                                label: 'Completed Orders',
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const WaiterOrdersScreen(initialTabIndex: 4),
                                    ),
                                  );
                                },
                              ),
                              _buildDivider(),
                              _buildOverviewMetricItem(
                                icon: Icons.groups_outlined,
                                iconColor: const Color(0xFF8B5CF6),
                                iconBg: const Color(0xFFF3E8FF),
                                value: totalTablesCount.toString().padLeft(2, '0'),
                                label: 'Total Tables',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // 6. Recent Orders Section
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Recent Orders',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2C140E),
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                if (widget.onNavigateTab != null) widget.onNavigateTab!(1); // Go to Orders
                              },
                              child: const Row(
                                children: [
                                  Text(
                                    'View All',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFE87524),
                                    ),
                                  ),
                                  Icon(Icons.chevron_right, size: 18, color: Color(0xFFE87524)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Recent Orders List Cards
                        if (ordersProvider.orders.isEmpty) ...[
                          _buildSampleOrderCard(context, 'Table T - 07', '2 Items • ₹320', '11:45 AM', 'Preparing', const Color(0xFFE6F4ED), const Color(0xFF0F3526), Icons.soup_kitchen_rounded, const Color(0xFFFFF4ED)),
                          _buildSampleOrderCard(context, 'Table T - 04', '3 Items • ₹450', '11:32 AM', 'Served', const Color(0xFFFEF3C7), const Color(0xFFD97706), Icons.local_drink_rounded, const Color(0xFFFCE7F3)),
                          _buildSampleOrderCard(context, 'Table T - 12', '1 Item • ₹180', '11:20 AM', 'New Order', const Color(0xFFEFF6FF), const Color(0xFF2563EB), Icons.ramen_dining_rounded, const Color(0xFFE6F4ED)),
                          _buildSampleOrderCard(context, 'Table T - 03', '4 Items • ₹620', '10:58 AM', 'Completed', const Color(0xFFE6FFFA), const Color(0xFF059669), Icons.dinner_dining_rounded, const Color(0xFFEEF2FF)),
                        ] else ...[
                          Column(
                            children: ordersProvider.orders.take(6).map((ord) {
                              return _buildRealOrderCard(context, ord);
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 🔔 New Order Popup Modal
  void _showNewOrderPopup(BuildContext context, OrderModel order) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 16,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated Bell / Icon Container
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFF4ED),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_active_rounded,
                    color: Color(0xFFE87524),
                    size: 32,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  '🔔 NEW ORDER ARRIVED!',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F2A1D),
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                  ),
                  child: Text(
                    'TABLE ${order.table.toUpperCase()} • ${order.orderId}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF166534),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Order Items & Total Summary Box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Customer: ${order.customer}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                          ),
                          Text(
                            'Status: ${order.status}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFE87524)),
                          ),
                        ],
                      ),
                      const Divider(height: 16),
                      if (order.items.isNotEmpty)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: order.items.take(4).map((it) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${it.quantity}x  ${it.name}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                  ),
                                  Text(
                                    '₹${(it.price * it.quantity).toStringAsFixed(0)}',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        )
                      else
                        const Text('Items summary placed by customer', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Bill Amount:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                          Text(
                            '₹${order.totalAmount.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Buttons Row
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          _isPopupShowing = false;
                          Navigator.pop(ctx);
                        },
                        child: const Text('Dismiss', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F2A1D),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          _isPopupShowing = false;
                          Navigator.pop(ctx);
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
                          );
                        },
                        child: const Text('View & Accept', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    ).then((_) {
      _isPopupShowing = false;
    });
  }

  // Helper Widget for Quick Action Tiles
  Widget _buildQuickActionTile(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFF4ED), // Soft Peach Tint
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: const Color(0xFFE87524), size: 20),
                ),
              ),
            ),
            const SizedBox(height: 6),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2C140E),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper Widget for Overview Metric Item inside Unified Card
  Widget _buildOverviewMetricItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String value,
    required String label,
    VoidCallback? onTap,
  }) {
    final content = Column(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Color(0xFF2C140E),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
            height: 1.1,
          ),
        ),
      ],
    );

    return Expanded(
      child: onTap != null
          ? GestureDetector(
              onTap: onTap,
              behavior: HitTestBehavior.opaque,
              child: content,
            )
          : content,
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 48,
      color: const Color(0xFFE2E8F0),
    );
  }

  // Sample Order Card
  Widget _buildSampleOrderCard(
    BuildContext context,
    String tableNum,
    String details,
    String time,
    String status,
    Color badgeBg,
    Color badgeTextColor,
    IconData icon,
    Color iconBg,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: badgeTextColor, size: 22),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tableNum,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2C140E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    details,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                time,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: badgeTextColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Real Order Card from Database
  Widget _buildRealOrderCard(BuildContext context, OrderModel ord) {
    Color badgeBg = const Color(0xFFFEF3C7);
    Color badgeText = const Color(0xFFD97706);
    String statusStr = ord.status.toUpperCase();

    if (statusStr.contains('PREPARING') || statusStr.contains('PENDING')) {
      badgeBg = const Color(0xFFE6F4ED);
      badgeText = const Color(0xFF0F3526);
      statusStr = 'Preparing';
    } else if (statusStr.contains('READY')) {
      badgeBg = const Color(0xFFFFF4ED);
      badgeText = const Color(0xFFE87524);
      statusStr = 'Ready';
    } else if (statusStr.contains('SERVED')) {
      badgeBg = const Color(0xFFFEF3C7);
      badgeText = const Color(0xFFD97706);
      statusStr = 'Served';
    } else if (statusStr.contains('COMPLETED') || ord.isPaid) {
      badgeBg = const Color(0xFFE6FFFA);
      badgeText = const Color(0xFF059669);
      statusStr = 'Completed';
    }

    final timeStr = ord.createdAt.length >= 16
        ? ord.createdAt.substring(11, 16)
        : '11:45 AM';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OrderDetailScreen(order: ord)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFF4ED),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.soup_kitchen_rounded, color: badgeText, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Table T - ${ord.tableNum}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C140E),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${ord.items.length} Items • ₹${ord.totalAmount.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  timeStr,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusStr,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: badgeText,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Active Accepted Order Hero Card (Matching Reference Screenshot Design)
  Widget _buildActiveOrderHeroCard(
    BuildContext context,
    List<OrderModel> acceptedOrders,
    int selectedIndex,
    Function(int) onSelectIndex,
  ) {
    final order = acceptedOrders[selectedIndex < acceptedOrders.length ? selectedIndex : 0];
    final itemsSummary = order.items.isNotEmpty
        ? order.items.map((i) => '${i.quantity}x ${i.name}').join(', ')
        : 'Table Order Items';

    final int progressPct = order.isServed
        ? 100
        : (order.isReadyToServe
            ? 80
            : (order.status.toLowerCase().contains('prepar') ? 40 : 20));

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0F1E36), // Deep Navy Slate (Matching Reference Screenshot)
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F1E36).withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: const Color(0xFF1E2D4A), width: 1.5),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Active Trip/Order dot + Order ID + Progress Badge Box
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFE87524), // Active Orange Dot
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'ACTIVE ORDER',
                                style: TextStyle(
                                  color: Color(0xFFE87524),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            order.orderId.startsWith('#') ? order.orderId : '#${order.orderId}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE87524),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  order.status.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'ETA 10-15 Mins',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Progress percentage box on right
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF192A45),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF263959)),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$progressPct%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Progress',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Route Section: Pickup -> Destination & View Details Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Route Timeline Graphics & Text
                    Expanded(
                      child: Row(
                        children: [
                          // Timeline Line Graphic
                          Column(
                            children: [
                              Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF3B82F6), width: 3),
                                ),
                              ),
                              Container(
                                margin: const EdgeInsets.symmetric(vertical: 2),
                                width: 2,
                                height: 26,
                                color: const Color(0xFF334155),
                              ),
                              const Icon(
                                Icons.location_on_rounded,
                                color: Color(0xFFEF4444),
                                size: 16,
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          // Pickup & Destination Labels
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'PICKUP',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const Text(
                                  'Kitchen Counter',
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'DESTINATION',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                Text(
                                  'Table T-${order.tableNum}',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Solid Orange "View Details >" Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE87524),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: const Color(0xFFE87524).withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
                        );
                      },
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'View Details',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Bottom Item summary row
                Row(
                  children: [
                    const Icon(Icons.restaurant_outlined, color: Color(0xFF64748B), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${order.items.length} Items ($itemsSummary) • ₹${order.totalAmount.toStringAsFixed(0)}',
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // If multiple orders are accepted: show "+1" badge section at the bottom of the card!
          if (acceptedOrders.length > 1) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFF142642), // Slightly lighter navy for footer
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
                border: Border(top: BorderSide(color: Color(0xFF1E2D4A), width: 1)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE87524),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFE87524).withValues(alpha: 0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          '+${acceptedOrders.length - 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${acceptedOrders.length - 1} More Active Order${acceptedOrders.length - 1 > 1 ? "s" : ""}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  InkWell(
                    onTap: () {
                      final nextIndex = (selectedIndex + 1) % acceptedOrders.length;
                      onSelectIndex(nextIndex);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: Row(
                        children: [
                          Text(
                            'Switch (${selectedIndex + 1}/${acceptedOrders.length})',
                            style: const TextStyle(
                              color: Color(0xFFE87524),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward_rounded, color: Color(0xFFE87524), size: 14),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // Hero Pending Acceptance Card (Matching Reference Design)
  Widget _buildPendingAcceptanceHeroCard(
    BuildContext context,
    OrderModel order,
    String waiterId,
    String waiterName,
    OrdersProvider ordersProvider,
  ) {
    final itemsSummary = order.items.isNotEmpty
        ? order.items.map((i) => '${i.quantity}x ${i.name}').join(', ')
        : 'Table Order Items';
    final formattedTime = order.createdAt.isNotEmpty
        ? (order.createdAt.length >= 16 ? order.createdAt.substring(0, 16).replaceAll('T', ' ') : order.createdAt)
        : DateTime.now().toString().substring(0, 16);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F2A1D), // Dark Emerald / Navy Chocolate
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F2A1D).withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: const Color(0xFF1E3A2B), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Pending Acceptance Pill & Order ID
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2415),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD97706), width: 1.5),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.access_time_filled, color: Color(0xFFF59E0B), size: 14),
                    SizedBox(width: 6),
                    Text(
                      'Pending Acceptance',
                      style: TextStyle(
                        color: Color(0xFFF59E0B),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '#${order.orderId}',
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Order Time Row
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, color: Color(0xFFE87524), size: 14),
              const SizedBox(width: 8),
              Text(
                'Order Time: $formattedTime',
                style: const TextStyle(
                  color: Color(0xFFCBD5E1),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Location / Table Route Row
          Row(
            children: [
              // Table Start
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE87524), width: 3),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Table T-${order.tableNum} (${order.customer})',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward, color: Color(0xFF64748B), size: 16),
              const SizedBox(width: 8),
              // Kitchen Target
              Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'Kitchen Pickup',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Items summary & Amount
          Row(
            children: [
              const Icon(Icons.restaurant_menu_outlined, color: Color(0xFF94A3B8), size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  itemsSummary,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Text(
                '₹${order.totalAmount.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Dual Side-by-Side Action Buttons: Reject & Accept
          Row(
            children: [
              // ❌ Reject Button
              Expanded(
                child: SizedBox(
                  height: 46,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFEF4444),
                      side: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      backgroundColor: Colors.red.withValues(alpha: 0.08),
                    ),
                    onPressed: () async {
                      await ordersProvider.rejectOrder(order.id, waiterId, waiterName);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Order #${order.orderId} rejected.'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFFEF4444)),
                    label: const Text(
                      'Reject',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFEF4444),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // ✔ Accept Button
              Expanded(
                child: SizedBox(
                  height: 46,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981), // Bright Vibrant Green
                      foregroundColor: const Color(0xFF0F2A1D),
                      elevation: 4,
                      shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () async {
                      await ordersProvider.acceptOrder(order.id, waiterId, waiterName);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Order #${order.orderId} accepted! Moved to serving.'),
                            backgroundColor: const Color(0xFF10B981),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.check_circle_rounded, size: 20, color: Color(0xFF0F2A1D)),
                    label: const Text(
                      'Accept',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F2A1D),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showProfilePopup(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black26,
      builder: (ctx) => _ProfilePopupModal(onNavigateTab: widget.onNavigateTab),
    );
  }
}

class _ProfilePopupModal extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const _ProfilePopupModal({this.onNavigateTab});

  @override
  State<_ProfilePopupModal> createState() => _ProfilePopupModalState();
}

class _ProfilePopupModalState extends State<_ProfilePopupModal> {
  bool _isOnline = true;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Dialog(
      alignment: Alignment.topRight,
      insetPadding: const EdgeInsets.only(top: 60, right: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      elevation: 12,
      child: Container(
        width: 250,
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Avatar, Name & Role Header
            Row(
              children: [
                UserAvatarWidget(
                  avatarUrl: user?.avatarUrl,
                  name: user?.name ?? 'Waiter',
                  radius: 20,
                  border: Border.all(color: const Color(0xFFE87524), width: 1.5),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'Waiter Staff',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user?.role ?? 'Waiter',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 10),

            // My Profile Option
            InkWell(
              onTap: () {
                Navigator.pop(context);
                if (widget.onNavigateTab != null) {
                  widget.onNavigateTab!(4); // Profile Tab
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const WaiterProfileScreen()),
                  );
                }
              },
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Row(
                  children: [
                    Icon(Icons.person_outline_rounded, size: 20, color: Color(0xFF334155)),
                    SizedBox(width: 12),
                    Text(
                      'My Profile',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Availability Status
            const Text(
              'Availability Status',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: _isOnline ? const Color(0xFF10B981) : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: _isOnline ? const Color(0xFF10B981) : Colors.grey,
                      ),
                    ),
                  ],
                ),
                Transform.scale(
                  scale: 0.85,
                  child: Switch(
                    value: _isOnline,
                    activeThumbColor: Colors.white,
                    activeTrackColor: const Color(0xFF10B981),
                    inactiveThumbColor: Colors.white,
                    inactiveTrackColor: Colors.grey[300],
                    onChanged: (val) {
                      setState(() {
                        _isOnline = val;
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 10),

            // Logout Option
            InkWell(
              onTap: () async {
                Navigator.pop(context);
                await authProvider.logout();
              },
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Row(
                  children: [
                    Icon(Icons.logout_rounded, size: 20, color: Color(0xFFEF4444)),
                    SizedBox(width: 12),
                    Text(
                      'Logout',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFEF4444),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
