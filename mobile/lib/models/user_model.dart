class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String phone;
  final String empId;
  final String branch;
  final String status;
  final String department;
  final String joinedDate;
  final String checkInTime;
  final String checkOutTime;
  final String scheduledShift;
  final String hoursLogged;
  final String attendanceStatus;
  final String avatarUrl;
  final List<String> assignedTables;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone = '',
    this.empId = '',
    this.branch = 'Flavora Kitchen Main Branch',
    this.status = 'Active',
    this.department = 'Operations & Floor Management',
    this.joinedDate = '',
    this.checkInTime = '09:00 AM',
    this.checkOutTime = '06:00 PM',
    this.scheduledShift = '09:00 AM – 06:00 PM (Morning)',
    this.hoursLogged = '8h 30m',
    this.attendanceStatus = 'Present',
    this.avatarUrl = '',
    this.assignedTables = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> tables = [];
    if (json['assignedTables'] != null) {
      if (json['assignedTables'] is List) {
        tables = (json['assignedTables'] as List).map((e) => e.toString()).toList();
      }
    }

    final idVal = json['_id']?.toString() ?? json['id']?.toString() ?? '';
    final roleVal = json['role']?.toString() ?? 'Waiter';
    
    // Auto-resolve Employee ID if blank
    String empIdVal = json['empId']?.toString() ?? '';
    if (empIdVal.isEmpty && roleVal.toLowerCase().contains('waiter')) {
      final suffix = idVal.length >= 2 ? idVal.substring(idVal.length - 2).toUpperCase() : '01';
      empIdVal = 'RMSW-$suffix';
    }

    return UserModel(
      id: idVal,
      name: json['name']?.toString() ?? 'Waiter Staff',
      email: json['email']?.toString() ?? '',
      role: roleVal,
      phone: json['phone']?.toString() ?? '',
      empId: empIdVal.isNotEmpty ? empIdVal : 'RMSW-01',
      branch: json['branch']?.toString().isNotEmpty == true ? json['branch'].toString() : 'Jubilee Hills (Main Branch)',
      status: json['status']?.toString().isNotEmpty == true ? json['status'].toString() : 'Active',
      department: json['department']?.toString().isNotEmpty == true ? json['department'].toString() : 'Operations & Floor Management',
      joinedDate: json['joinedDate']?.toString() ?? '',
      checkInTime: json['checkInTime']?.toString() ?? '09:00 AM',
      checkOutTime: json['checkOutTime']?.toString() ?? '06:00 PM',
      scheduledShift: json['scheduledShift']?.toString() ?? json['shift']?.toString() ?? '09:00 AM – 06:00 PM (Morning)',
      hoursLogged: json['hoursLogged']?.toString() ?? '8h 30m',
      attendanceStatus: json['attendanceStatus']?.toString() ?? 'Present',
      avatarUrl: json['avatarUrl']?.toString() ?? '',
      assignedTables: tables,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'empId': empId,
      'branch': branch,
      'status': status,
      'department': department,
      'joinedDate': joinedDate,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'scheduledShift': scheduledShift,
      'hoursLogged': hoursLogged,
      'attendanceStatus': attendanceStatus,
      'avatarUrl': avatarUrl,
      'assignedTables': assignedTables,
    };
  }
}
