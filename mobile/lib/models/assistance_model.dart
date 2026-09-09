class AssistanceModel {
  final String id;
  final String tableNum;
  final String reason;
  final String status; // PENDING, RESOLVED
  final DateTime createdAt;

  AssistanceModel({
    required this.id,
    required this.tableNum,
    required this.reason,
    this.status = 'PENDING',
    required this.createdAt,
  });

  factory AssistanceModel.fromJson(Map<String, dynamic> json) {
    return AssistanceModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      tableNum: json['tableNum']?.toString() ?? json['table']?.toString() ?? 'T-01',
      reason: json['reason']?.toString() ?? 'Assistance',
      status: json['status']?.toString() ?? 'PENDING',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
