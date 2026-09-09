import 'package:flutter/material.dart';
import '../models/table_model.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';

class TablesProvider with ChangeNotifier {
  List<TableModel> _tables = [];
  bool _isLoading = false;
  String? _error;

  List<TableModel> get tables => _tables;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Show all floor tables for waiter because waiter can accept orders for any table
  List<TableModel> getMyTables(String waiterId, String waiterName, List<String> assignedList) {
    return _tables;
  }

  Future<void> fetchTables() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiConstants.getTables);
      if (res is List) {
        _tables = res.map((e) => TableModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateStatus(String tableId, String status, {String currentOrder = ''}) async {
    try {
      await ApiClient.put(
        ApiConstants.updateTableStatus(tableId),
        body: {'status': status, 'currentOrder': currentOrder},
      );
      await fetchTables();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> vacateTable(String tableNum) async {
    try {
      await ApiClient.post(
        ApiConstants.vacateTable,
        body: {'tableNum': tableNum},
      );
      await fetchTables();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
