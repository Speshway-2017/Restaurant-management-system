import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';
import '../../widgets/user_avatar_widget.dart';
import '../../widgets/check_in_toggle_widget.dart';
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

    if (!mounted) return;

    final latestOrder = ordersProvider.latestNewOrder;
    if (latestOrder != null) {
      _notifiedOrderIds.add(latestOrder.id);
      ordersProvider.clearLatestNewOrder();
    }

    final unhandledOrders = ordersProvider.orders
        .where((o) =>
            !o.isPaid &&
            !_notifiedOrderIds.contains(o.id) &&
            (o.status == 'Placed' ||
                o.isReadyToServe ||
                o.waiterStatus == 'PENDING'))
        .toList();

    for (var o in unhandledOrders) {
      _notifiedOrderIds.add(o.id);
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

    final myTables =
        tablesProvider.getMyTables(waiterId, waiterName, assignedTables);
    final totalTablesCount = tablesProvider.tables.length;
    final occupiedTablesCount = myTables.isNotEmpty
        ? myTables.where((t) => t.isOccupied).length
        : tablesProvider.tables.where((t) => t.isOccupied).length;

    final myOrders =
        ordersProvider.getMyOrders(waiterId, waiterName, assignedTables);
    final activeOrders =
        myOrders.where((o) => !o.isPaid && o.status != 'SERVED').toList();
    final completedOrders =
        myOrders.where((o) => o.status == 'SERVED' || o.isPaid).toList();
    final pendingAcceptanceOrders = myOrders
        .where((o) =>
            !o.isPaid &&
            !o.isAcceptedByWaiter &&
            (o.isReadyToServe ||
                o.status.toLowerCase() == 'placed' ||
                o.waiterStatus.toUpperCase() == 'PENDING'))
        .toList();
    final acceptedOrders = myOrders
        .where((o) => !o.isPaid && o.isAcceptedByWaiter && o.status != 'SERVED')
        .toList();

    // All active hero orders (Pending acceptance orders first, followed by Accepted orders)
    final allHeroActiveOrders = [
      ...pendingAcceptanceOrders,
      ...acceptedOrders,
    ];

    if (_selectedActiveOrderIndex >= allHeroActiveOrders.length) {
      _selectedActiveOrderIndex = 0;
    }

    final firstName = (user?.name ?? 'Waiter').split(' ')[0];
    final empIdVal = user?.empId ?? '';
    final userIdVal = user?.id ?? '';
    final empIdDisplay = empIdVal.isNotEmpty
        ? empIdVal
        : (userIdVal.length >= 4
            ? 'RMSW-${userIdVal.substring(userIdVal.length - 4).toUpperCase()}'
            : 'N/A');

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 1. Top Header Bar (Dark Background)
            Container(
              color: const Color(0xFF0F2A1D),
              child: Padding(
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
                              errorBuilder: (_, __, ___) => const Icon(
                                  Icons.restaurant_menu,
                                  color: Color(0xFFE87524),
                                  size: 24),
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
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                                width: 1.5),
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
                                border: Border.all(
                                    color: const Color(0xFF2B150E), width: 2),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Main Sheet Content (Pure White Background with Top Curved Corners)
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Colors.white, // Pure White
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
                        // 3. Hero Card (Swipeable deck for all Pending and Accepted active orders)
                        if (allHeroActiveOrders.isNotEmpty) ...[
                          _buildActiveOrderHeroCard(
                            context,
                            allHeroActiveOrders,
                            _selectedActiveOrderIndex,
                            (idx) {
                              setState(() {
                                _selectedActiveOrderIndex = idx;
                              });
                            },
                            waiterId,
                            waiterName,
                            ordersProvider,
                          ),
                        ] else ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                vertical: 20, horizontal: 20),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF4A2318), Color(0xFF2B150E)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF2B150E)
                                      .withValues(alpha: 0.25),
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
                                    border: Border.all(
                                        color: Colors.white
                                            .withValues(alpha: 0.2)),
                                  ),
                                  child: const Icon(
                                    Icons.room_service_rounded,
                                    color:
                                        Color(0xFFFFB800), // Rich Golden Yellow
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
                                  '${user?.branch.isNotEmpty == true ? user!.branch : "Main Branch"} • Active Shift',
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

                        // 4. Dashboard Overview Section
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
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 4),
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
                                icon: Icons.receipt_long_rounded,
                                iconColor: const Color(0xFF10B981),
                                iconBg: const Color(0xFFECFDF5),
                                value: activeOrders.length
                                    .toString()
                                    .padLeft(2, '0'),
                                label: 'Active Orders',
                              ),
                              _buildDivider(),
                              _buildOverviewMetricItem(
                                icon: Icons.grid_view_rounded,
                                iconColor: const Color(0xFF3B82F6),
                                iconBg: const Color(0xFFEFF6FF),
                                value: occupiedTablesCount
                                    .toString()
                                    .padLeft(2, '0'),
                                label: 'Occupied Tables',
                              ),
                              _buildDivider(),
                              _buildOverviewMetricItem(
                                icon: Icons.check_circle_outline_rounded,
                                iconColor: const Color(0xFFF59E0B),
                                iconBg: const Color(0xFFFEF3C7),
                                value: completedOrders.length
                                    .toString()
                                    .padLeft(2, '0'),
                                label: 'Completed Orders',
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const WaiterOrdersScreen(
                                          initialTabIndex: 0),
                                    ),
                                  );
                                },
                              ),
                              _buildDivider(),
                              _buildOverviewMetricItem(
                                icon: Icons.groups_outlined,
                                iconColor: const Color(0xFF8B5CF6),
                                iconBg: const Color(0xFFF3E8FF),
                                value:
                                    totalTablesCount.toString().padLeft(2, '0'),
                                label: 'Total Tables',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // 5. Quick Actions Section Title
                        const Text(
                          'Quick Actions',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2C140E),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Quick Action Items (4 Balanced Full-Width Tiles)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildQuickActionTile(
                              context,
                              icon: Icons.grid_view_rounded,
                              label: 'Tables',
                              onTap: () {
                                if (widget.onNavigateTab != null) {
                                  widget.onNavigateTab!(1); // Tables
                                }
                              },
                            ),
                            _buildQuickActionTile(
                              context,
                              icon: Icons.receipt_long_rounded,
                              label: 'Orders',
                              onTap: () {
                                if (widget.onNavigateTab != null) {
                                  widget.onNavigateTab!(2); // Orders
                                }
                              },
                            ),
                            _buildQuickActionTile(
                              context,
                              icon: Icons.person_outline_rounded,
                              label: 'Profile',
                              onTap: () {
                                if (widget.onNavigateTab != null) {
                                  widget.onNavigateTab!(4); // Profile
                                }
                              },
                            ),
                            _buildQuickActionTile(
                              context,
                              icon: Icons.settings_outlined,
                              label: 'Settings',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const WaiterSettingsScreen()),
                                );
                              },
                            ),
                          ],
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
                                if (widget.onNavigateTab != null) {
                                  widget.onNavigateTab!(2); // Go to Orders
                                }
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
                                  Icon(Icons.chevron_right,
                                      size: 18, color: Color(0xFFE87524)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Recent Orders List Cards
                        if (myOrders.isEmpty) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                vertical: 24, horizontal: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border:
                                  Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: const Column(
                              children: [
                                Icon(Icons.inbox_outlined,
                                    size: 36, color: Color(0xFF94A3B8)),
                                SizedBox(height: 8),
                                Text(
                                  'No Recent Orders',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF2C140E)),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Orders placed at your assigned tables will appear here in real time.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      fontSize: 12, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          Column(
                            children: myOrders.take(6).map((ord) {
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

  // Helper Widget for Quick Action Tiles
  Widget _buildQuickActionTile(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
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
                  child: Icon(icon, color: const Color(0xFFE87524), size: 21),
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
    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(icon, color: iconColor, size: 18),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF2C140E),
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
              height: 1.15,
            ),
          ),
        ],
      ),
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
      height: 42,
      color: const Color(0xFFE2E8F0),
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
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFFF4ED),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.receipt_long_rounded,
                        color: badgeText, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Table T - ${ord.tableNum}',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2C140E),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${ord.items.length} Items • ₹${ord.totalAmount.toStringAsFixed(0)}',
                          overflow: TextOverflow.ellipsis,
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
            ),
            const SizedBox(width: 8),
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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

  // Hero Card Stack for All Active Orders (Pending & Accepted)
  Widget _buildActiveOrderHeroCard(
    BuildContext context,
    List<OrderModel> orders,
    int selectedIndex,
    Function(int) onSelectIndex,
    String waiterId,
    String waiterName,
    OrdersProvider ordersProvider,
  ) {
    return _ActiveOrdersTinderStack(
      orders: orders,
      selectedIndex: selectedIndex,
      onSelectIndex: onSelectIndex,
      waiterId: waiterId,
      waiterName: waiterName,
      ordersProvider: ordersProvider,
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

class _ActiveOrdersTinderStack extends StatefulWidget {
  final List<OrderModel> orders;
  final int selectedIndex;
  final Function(int) onSelectIndex;
  final String waiterId;
  final String waiterName;
  final OrdersProvider ordersProvider;

  const _ActiveOrdersTinderStack({
    required this.orders,
    required this.selectedIndex,
    required this.onSelectIndex,
    required this.waiterId,
    required this.waiterName,
    required this.ordersProvider,
  });

  @override
  State<_ActiveOrdersTinderStack> createState() =>
      _ActiveOrdersTinderStackState();
}

class _ActiveOrdersTinderStackState extends State<_ActiveOrdersTinderStack> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.selectedIndex);
  }

  @override
  void didUpdateWidget(covariant _ActiveOrdersTinderStack oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedIndex != oldWidget.selectedIndex) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _pageController.hasClients) {
          if (_pageController.page?.round() != widget.selectedIndex) {
            _pageController.animateToPage(
              widget.selectedIndex,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
            );
          }
        }
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.orders.isEmpty) return const SizedBox.shrink();

    final count = widget.orders.length;
    final safeIndex = widget.selectedIndex % count;

    if (count == 1) {
      return _buildSingleActiveOrderCard(
        context,
        widget.orders.first,
        isForeground: true,
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 255,
          child: PageView.builder(
            controller: _pageController,
            itemCount: count,
            onPageChanged: (index) {
              widget.onSelectIndex(index);
            },
            itemBuilder: (context, index) {
              final order = widget.orders[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: _buildSingleActiveOrderCard(
                  context,
                  order,
                  isForeground: true,
                  orderIndex: index + 1,
                  totalOrders: count,
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: safeIndex > 0
                  ? () {
                      _pageController.previousPage(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeInOut,
                      );
                    }
                  : null,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.arrow_back_ios_rounded,
                  size: 14,
                  color: safeIndex > 0 ? const Color(0xFFE87524) : const Color(0xFFCBD5E1),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Swipe left/right for next order • ${safeIndex + 1} of $count',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: safeIndex < count - 1
                  ? () {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeInOut,
                      );
                    }
                  : null,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: safeIndex < count - 1 ? const Color(0xFFE87524) : const Color(0xFFCBD5E1),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSingleActiveOrderCard(
    BuildContext context,
    OrderModel order, {
    required bool isForeground,
    int? orderIndex,
    int? totalOrders,
  }) {
    final isPending = !order.isAcceptedByWaiter;

    final itemsSummary = order.items.isNotEmpty
        ? order.items.map((i) => '${i.quantity}x ${i.name}').join(', ')
        : 'Active Order Items';
    final formattedTime = order.createdAt.isNotEmpty
        ? (order.createdAt.length >= 16
            ? order.createdAt.substring(0, 16).replaceAll('T', ' ')
            : order.createdAt)
        : DateTime.now().toString().substring(0, 16);

    String statusStr = order.status.toUpperCase();
    Color statusBg = const Color(0xFFECFDF5);
    Color statusTextColor = const Color(0xFF047857);

    if (isPending) {
      statusStr = 'PENDING ACCEPTANCE';
      statusBg = const Color(0xFF2C2415);
      statusTextColor = const Color(0xFFF59E0B);
    } else if (statusStr.contains('COOKING') || statusStr.contains('PREPARING')) {
      statusStr = 'IN KITCHEN';
      statusBg = const Color(0xFFFFF4ED);
      statusTextColor = const Color(0xFFE87524);
    } else if (statusStr.contains('READY')) {
      statusStr = 'READY TO SERVE';
      statusBg = const Color(0xFFECFDF5);
      statusTextColor = const Color(0xFF059669);
    } else {
      statusStr = 'ACCEPTED';
      statusBg = const Color(0xFFEFF6FF);
      statusTextColor = const Color(0xFF3B82F6);
    }

    final cardBg = isPending ? const Color(0xFF0F2A1D) : const Color(0xFF0F1E36);
    final border = isPending
        ? Border.all(color: const Color(0xFF1E3A2B), width: 1.5)
        : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: border,
        boxShadow: [
          BoxShadow(
            color: cardBg.withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (isPending) ...[
                Flexible(
                  fit: FlexFit.loose,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2C2415),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFD97706), width: 1.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.access_time_filled,
                            color: Color(0xFFF59E0B), size: 13),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            totalOrders != null && totalOrders > 1
                                ? 'Pending Acceptance ($orderIndex/$totalOrders)'
                                : 'Pending Acceptance',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFFF59E0B),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '#${order.orderId}',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE87524).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFE87524).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.bolt_rounded,
                          color: Color(0xFFE87524), size: 14),
                      const SizedBox(width: 4),
                      Text(
                        orderIndex != null && totalOrders != null && totalOrders > 1
                            ? 'ACTIVE ORDER ($orderIndex/$totalOrders)'
                            : 'ACTIVE ORDER',
                        style: const TextStyle(
                          color: Color(0xFFE87524),
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusStr,
                    style: TextStyle(
                      color: statusTextColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),

          // Order Time Row
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  color: Color(0xFFE87524), size: 14),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'Order Time: $formattedTime',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFFCBD5E1),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Location / Table Route Row
          Row(
            children: [
              Container(
                width: 11,
                height: 11,
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
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward,
                  color: Color(0xFF64748B), size: 14),
              const SizedBox(width: 6),
              Container(
                width: 11,
                height: 11,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
              const Text(
                'Kitchen',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Items summary & Amount
          Row(
            children: [
              const Icon(Icons.restaurant_menu_outlined,
                  color: Color(0xFF94A3B8), size: 16),
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

          // Bottom Action Row
          if (isPending) ...[
            Row(
              children: [
                // ❌ Reject Button
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(
                            color: Color(0xFFEF4444), width: 1.5),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        backgroundColor: Colors.red.withValues(alpha: 0.08),
                      ),
                      onPressed: () async {
                        await widget.ordersProvider.rejectOrder(
                            order.id, widget.waiterId, widget.waiterName);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Order #${order.orderId} rejected.'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.close_rounded,
                          size: 18, color: Color(0xFFEF4444)),
                      label: const Text(
                        'Reject',
                        style: TextStyle(
                          fontSize: 14,
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
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: const Color(0xFF0F2A1D),
                        elevation: 4,
                        shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        await widget.ordersProvider.acceptOrder(
                            order.id, widget.waiterId, widget.waiterName);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  'Order #${order.orderId} accepted! Moved to kitchen.'),
                              backgroundColor: const Color(0xFF10B981),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.check_circle_rounded,
                          size: 19, color: Color(0xFF0F2A1D)),
                      label: const Text(
                        'Accept',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F2A1D),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE87524),
                  foregroundColor: Colors.white,
                  elevation: 3,
                  shadowColor: const Color(0xFFE87524).withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OrderDetailScreen(order: order),
                    ),
                  );
                },
                icon: const Icon(Icons.visibility_rounded, size: 18),
                label: const Text(
                  'View Details',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
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
  bool _isUpdatingShift = false;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final isCheckedIn = user?.isCheckedIn ?? true;
    final checkInTime =
        user?.checkInTime.isNotEmpty == true ? user!.checkInTime : '09:00 AM';
    final checkOutTime =
        user?.checkOutTime.isNotEmpty == true ? user!.checkOutTime : '';

    return Dialog(
      alignment: Alignment.topRight,
      insetPadding: const EdgeInsets.only(top: 60, right: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      elevation: 12,
      child: Container(
        width: 265,
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
                  border:
                      Border.all(color: const Color(0xFFE87524), width: 1.5),
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
                        '${user?.role ?? "Waiter"} • ${user?.branch.isNotEmpty == true ? user!.branch : "Main Branch"}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Live Attendance / Shift Status Pill
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isCheckedIn
                    ? const Color(0xFFECFDF5)
                    : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isCheckedIn
                      ? const Color(0xFFA7F3D0)
                      : const Color(0xFFFCA5A5),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isCheckedIn
                        ? Icons.check_circle_rounded
                        : Icons.pause_circle_filled_rounded,
                    size: 14,
                    color: isCheckedIn
                        ? const Color(0xFF059669)
                        : const Color(0xFFDC2626),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isCheckedIn
                          ? 'Checked In ($checkInTime)'
                          : (checkOutTime.isNotEmpty
                              ? 'Checked Out ($checkOutTime)'
                              : 'Checked Out'),
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isCheckedIn
                            ? const Color(0xFF047857)
                            : const Color(0xFFB91C1C),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 6),

            // Tactile Sliding Availability Toggle Row
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Row(
                      children: [
                        Icon(Icons.toggle_on_outlined,
                            size: 20, color: Color(0xFF334155)),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Availability',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  CheckInToggleWidget(
                    isCheckedIn: isCheckedIn,
                    isLoading: _isUpdatingShift,
                    width: 50,
                    height: 24,
                    showAvailabilityLabel: false,
                    onToggle: (newVal) async {
                      setState(() => _isUpdatingShift = true);
                      final messenger = ScaffoldMessenger.of(context);
                      bool success;
                      if (!newVal) {
                        success = await authProvider.checkOut();
                        if (mounted && success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content:
                                  Text('✓ Checked Out of Shift successfully'),
                              backgroundColor: Color(0xFFD97706),
                            ),
                          );
                        }
                      } else {
                        success = await authProvider.checkIn();
                        if (mounted && success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content:
                                  Text('✓ Checked In for Shift successfully'),
                              backgroundColor: Color(0xFF0F2A1D),
                            ),
                          );
                        }
                      }
                      if (mounted) {
                        setState(() => _isUpdatingShift = false);
                      }
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 6),

            // My Profile Option
            InkWell(
              onTap: () {
                Navigator.pop(context);
                if (widget.onNavigateTab != null) {
                  widget.onNavigateTab!(4); // Profile Tab
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const WaiterProfileScreen()),
                  );
                }
              },
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Row(
                  children: [
                    Icon(Icons.person_outline_rounded,
                        size: 20, color: Color(0xFF334155)),
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

            const SizedBox(height: 6),

            // Settings Option
            InkWell(
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const WaiterSettingsScreen()),
                );
              },
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Row(
                  children: [
                    Icon(Icons.settings_outlined,
                        size: 20, color: Color(0xFF334155)),
                    SizedBox(width: 12),
                    Text(
                      'App Settings',
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

            const SizedBox(height: 8),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 8),

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
                    Icon(Icons.logout_rounded,
                        size: 20, color: Color(0xFFEF4444)),
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
