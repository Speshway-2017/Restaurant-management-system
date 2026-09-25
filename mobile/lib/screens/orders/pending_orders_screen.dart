import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import 'order_detail_screen.dart';

/// Full-screen list of every pending-acceptance order.
/// Opened from the "View More (N)" footer on the dashboard hero card.
///
/// When the waiter accepts any order, this screen:
///   1. Shows a brief success overlay
///   2. Pops back to the dashboard
///   3. Calls [onNavigateTab](2) to jump straight to the Orders/active tab
class PendingOrdersScreen extends StatefulWidget {
  /// Callback to switch the bottom-nav tab.
  /// Pass `widget.onNavigateTab` from the dashboard so accepting
  /// an order immediately takes the waiter to the active-orders view.
  final Function(int)? onNavigateTab;

  const PendingOrdersScreen({super.key, this.onNavigateTab});

  @override
  State<PendingOrdersScreen> createState() => _PendingOrdersScreenState();
}

class _PendingOrdersScreenState extends State<PendingOrdersScreen> {
  final Set<String> _loadingIds = {};

  /// True while any accept request is in-flight.
  /// Used to disable ALL accept/reject buttons so the waiter
  /// cannot accept two orders simultaneously.
  bool _isAccepting = false;

  Future<void> _accept(
    OrderModel order,
    String waiterId,
    String waiterName,
    OrdersProvider provider,
  ) async {
    if (_isAccepting) return; // prevent double-tap
    setState(() {
      _isAccepting = true;
      _loadingIds.add(order.id);
    });

    final ok = await provider.acceptOrder(order.id, waiterId, waiterName);
    if (!mounted) return;

    if (ok) {
      // ── Success: haptic + brief visual feedback, then navigate away ──
      HapticFeedback.mediumImpact();
      _showSuccessOverlay(order);
    } else {
      setState(() {
        _isAccepting = false;
        _loadingIds.remove(order.id);
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Failed to accept order. Please try again.'),
        backgroundColor: Colors.red,
      ));
    }
  }

  /// Shows a green success overlay for 900 ms, then pops back and
  /// switches the bottom-nav to the Orders (index 2) tab.
  void _showSuccessOverlay(OrderModel order) {
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (_) => Center(
        child: Container(
          width: 200,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          decoration: BoxDecoration(
            color: const Color(0xFF0F2A1D),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF10B981), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: Color(0xFF10B981), size: 34),
              ),
              const SizedBox(height: 14),
              const Text(
                'Accepted!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '#${order.orderId}',
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Table T-${order.tableNum}',
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    // After 900 ms: dismiss overlay → pop back → switch to Orders tab
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop(); // close overlay
      Navigator.of(context).pop(); // go back to dashboard
      if (widget.onNavigateTab != null) {
        widget.onNavigateTab!(2); // jump to Orders tab
      }
    });
  }

  Future<void> _reject(
    OrderModel order,
    String waiterId,
    String waiterName,
    OrdersProvider provider,
  ) async {
    if (_isAccepting) return; // block while accepting
    setState(() => _loadingIds.add(order.id));
    final ok = await provider.rejectOrder(order.id, waiterId, waiterName);
    if (!mounted) return;
    setState(() => _loadingIds.remove(order.id));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok
          ? 'Order #${order.orderId} rejected.'
          : 'Failed to reject order.'),
      backgroundColor: ok ? Colors.red : const Color(0xFF64748B),
    ));
  }


  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final provider = Provider.of<OrdersProvider>(context);
    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';
    final assignedTables = user?.assignedTables ?? [];

    final myOrders =
        provider.getMyOrders(waiterId, waiterName, assignedTables);
    final pendingOrders = myOrders
        .where((o) =>
            !o.isPaid &&
            !o.isAcceptedByWaiter &&
            (o.isReadyToServe ||
                o.status.toLowerCase() == 'placed' ||
                o.waiterStatus.toUpperCase() == 'PENDING'))
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F2A1D),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pending Orders',
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
            Text(
              '${pendingOrders.length} awaiting your acceptance',
              style: TextStyle(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${pendingOrders.length}',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFFE87524),
        onRefresh: () => provider.fetchOrders(silent: true),
        child: pendingOrders.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: pendingOrders.length,
                itemBuilder: (ctx, i) => _buildPendingCard(
                  context,
                  pendingOrders[i],
                  waiterId,
                  waiterName,
                  provider,
                  index: i + 1,
                  total: pendingOrders.length,
                ),
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF86EFAC), width: 2),
            ),
            child: const Icon(Icons.check_circle_outline_rounded,
                size: 40, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 16),
          const Text('All Caught Up!',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F2A1D))),
          const SizedBox(height: 6),
          const Text('No orders awaiting acceptance right now.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildPendingCard(
    BuildContext context,
    OrderModel order,
    String waiterId,
    String waiterName,
    OrdersProvider provider, {
    required int index,
    required int total,
  }) {
    final isLoading = _loadingIds.contains(order.id);
    final itemsSummary = order.items.isNotEmpty
        ? order.items.map((i) => '${i.quantity}x ${i.name}').join(', ')
        : 'Table Order Items';
    final formattedTime =
        order.createdAt.isNotEmpty && order.createdAt.length >= 16
            ? order.createdAt.substring(0, 16).replaceAll('T', ' ')
            : DateTime.now().toString().substring(0, 16);

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF0F2A1D),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF1E3A2B), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F2A1D).withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            // ── Card body ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: badge + counter + order id
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2C2415),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: const Color(0xFFD97706), width: 1.5),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.access_time_filled,
                                color: Color(0xFFF59E0B), size: 13),
                            SizedBox(width: 5),
                            Text(
                              'Pending Acceptance',
                              style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '$index / $total',
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.4),
                                fontSize: 10,
                                fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '#${order.orderId}',
                            style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 13,
                                fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Time row
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          color: Color(0xFFE87524), size: 13),
                      const SizedBox(width: 7),
                      Text(
                        'Order Time: $formattedTime',
                        style: const TextStyle(
                            color: Color(0xFFCBD5E1),
                            fontSize: 12,
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Table → Kitchen route
                  Row(
                    children: [
                      Container(
                        width: 11,
                        height: 11,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: const Color(0xFFE87524), width: 2.5),
                        ),
                      ),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          'Table T-${order.tableNum} (${order.customer})',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Icon(Icons.arrow_forward,
                          color: Color(0xFF64748B), size: 15),
                      const SizedBox(width: 7),
                      Container(
                        width: 11,
                        height: 11,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Text('Kitchen',
                          style: TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 13,
                              fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Items + amount
                  Row(
                    children: [
                      const Icon(Icons.restaurant_menu_outlined,
                          color: Color(0xFF94A3B8), size: 15),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          itemsSummary,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                          style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 12,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                      Text(
                        '₹${order.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Action buttons footer ─────────────────────────────────
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFF142F1E),
                borderRadius:
                    BorderRadius.vertical(bottom: Radius.circular(20)),
                border: Border(
                    top: BorderSide(color: Color(0xFF1E3A2B), width: 1)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: isLoading || _isAccepting
                  ? Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Color(0xFF10B981),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _isAccepting && !isLoading
                                ? 'Accepted — opening orders…'
                                : 'Processing…',
                            style: const TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    )
                  : Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFEF4444),
                                side: const BorderSide(
                                    color: Color(0xFFEF4444), width: 1.5),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                backgroundColor:
                                    Colors.red.withValues(alpha: 0.08),
                              ),
                              // null disables the button (Flutter greys it out)
                              onPressed: _isAccepting
                                  ? null
                                  : () => _reject(
                                      order, waiterId, waiterName, provider),
                              icon: const Icon(Icons.close_rounded,
                                  size: 17, color: Color(0xFFEF4444)),
                              label: const Text('Reject',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFFEF4444))),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: const Color(0xFF0F2A1D),
                                elevation: 3,
                                shadowColor: const Color(0xFF10B981)
                                    .withValues(alpha: 0.4),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: _isAccepting
                                  ? null
                                  : () => _accept(
                                      order, waiterId, waiterName, provider),
                              icon: const Icon(Icons.check_circle_rounded,
                                  size: 18, color: Color(0xFF0F2A1D)),
                              label: const Text('Accept',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F2A1D))),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
