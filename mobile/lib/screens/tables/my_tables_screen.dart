import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/tables_provider.dart';
import '../../models/table_model.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/table_card_widget.dart';
import 'table_detail_screen.dart';

class MyTablesScreen extends StatefulWidget {
  const MyTablesScreen({super.key});

  @override
  State<MyTablesScreen> createState() => _MyTablesScreenState();
}

class _MyTablesScreenState extends State<MyTablesScreen> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final tablesProvider = Provider.of<TablesProvider>(context);

    final waiterId = user?.id ?? '';
    final waiterName = user?.name ?? '';
    final assignedTables = user?.assignedTables ?? [];

    final allTables = tablesProvider.getMyTables(waiterId, waiterName, assignedTables);

    List<TableModel> filteredTables = allTables;
    if (_selectedFilter == 'AVAILABLE') {
      filteredTables = allTables.where((t) => t.status.toLowerCase() == 'available' || t.status.toLowerCase() == 'vacant').toList();
    } else if (_selectedFilter == 'OCCUPIED') {
      filteredTables = allTables.where((t) => t.isOccupied).toList();
    } else if (_selectedFilter == 'RESERVED') {
      filteredTables = allTables.where((t) => t.status.toLowerCase() == 'reserved').toList();
    } else if (_selectedFilter == 'CLEANING') {
      filteredTables = allTables.where((t) => t.status.toLowerCase().contains('clean')).toList();
    }

    final totalCount = allTables.length;
    final occupiedCount = allTables.where((t) => t.isOccupied).length;
    final availableCount = allTables.where((t) => t.status.toLowerCase() == 'available' || t.status.toLowerCase() == 'vacant').length;
    final reservedCount = allTables.where((t) => t.status.toLowerCase() == 'reserved').length;
    final cleaningCount = allTables.where((t) => t.status.toLowerCase().contains('clean')).length;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Restaurant Floor Tables', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(
              'Showing all $totalCount tables • Any waiter can accept orders',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w400),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.grey[50],
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', 'All ($totalCount)', Colors.blueGrey),
                  const SizedBox(width: 8),
                  _buildFilterChip('AVAILABLE', 'Available ($availableCount)', AppColors.accentGreen),
                  const SizedBox(width: 8),
                  _buildFilterChip('OCCUPIED', 'Occupied ($occupiedCount)', AppColors.occupiedText),
                  const SizedBox(width: 8),
                  _buildFilterChip('RESERVED', 'Reserved ($reservedCount)', Colors.purple),
                  const SizedBox(width: 8),
                  _buildFilterChip('CLEANING', 'Cleaning ($cleaningCount)', Colors.amber.shade800),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          // Main Tables List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => tablesProvider.fetchTables(),
              child: tablesProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filteredTables.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.table_restaurant_outlined, size: 56, color: AppColors.textSecondary),
                                const SizedBox(height: 12),
                                Text(
                                  _selectedFilter == 'ALL' ? 'No Tables Available' : 'No $_selectedFilter Tables',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Floor tables managed by reception/waiters will appear here.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredTables.length,
                          itemBuilder: (context, index) {
                            final table = filteredTables[index];
                            return TableCardWidget(
                              table: table,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => TableDetailScreen(table: table),
                                  ),
                                );
                              },
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label, Color color) {
    final isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : AppColors.textPrimary,
        ),
      ),
      selected: isSelected,
      selectedColor: color,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isSelected ? color : Colors.grey.shade300),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = filterKey;
          });
        }
      },
    );
  }
}
