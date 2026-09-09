class TableModel {
  final String id;
  final String number;
  final String name;
  final int seats;
  final String section;
  final String status;
  final String currentOrder;
  final String activeSessionId;
  final List<String> mergedWith;
  final String assignedWaiterId;
  final String assignedWaiterName;

  TableModel({
    required this.id,
    required this.number,
    required this.name,
    this.seats = 4,
    this.section = 'Main Hall',
    this.status = 'Available',
    this.currentOrder = '',
    this.activeSessionId = '',
    this.mergedWith = const [],
    this.assignedWaiterId = '',
    this.assignedWaiterName = '',
  });

  factory TableModel.fromJson(Map<String, dynamic> json) {
    List<String> merged = [];
    if (json['mergedWith'] != null && json['mergedWith'] is List) {
      merged = (json['mergedWith'] as List).map((e) => e.toString()).toList();
    }

    return TableModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      number: json['number']?.toString() ?? json['num']?.toString() ?? 'T-01',
      name: json['name']?.toString() ?? json['number']?.toString() ?? 'Table',
      seats: int.tryParse(json['seats']?.toString() ?? '4') ?? 4,
      section: json['section']?.toString() ?? 'Main Hall',
      status: json['status']?.toString() ?? 'Available',
      currentOrder: json['currentOrder']?.toString() ?? '',
      activeSessionId: json['activeSessionId']?.toString() ?? '',
      mergedWith: merged,
      assignedWaiterId: json['assignedWaiterId']?.toString() ?? '',
      assignedWaiterName: json['assignedWaiterName']?.toString() ?? '',
    );
  }

  bool get isOccupied => status.toUpperCase() == 'OCCUPIED' || status.toUpperCase() == 'BUSY';

  bool isAssignedToWaiter(String waiterId, String waiterName, List<String> waiterAssignedTables) {
    if (assignedWaiterId.isNotEmpty && assignedWaiterId == waiterId) return true;
    if (assignedWaiterName.isNotEmpty && assignedWaiterName.toLowerCase() == waiterName.toLowerCase()) return true;
    final cleanNum = number.replaceAll(RegExp(r'[^0-9]'), '');
    for (var t in waiterAssignedTables) {
      final tClean = t.replaceAll(RegExp(r'[^0-9]'), '');
      if (tClean.isNotEmpty && cleanNum.isNotEmpty && int.tryParse(tClean) == int.tryParse(cleanNum)) {
        return true;
      }
    }
    return false;
  }
}
