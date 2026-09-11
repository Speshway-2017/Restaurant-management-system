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
    this.branch = 'Main Branch',
    this.status = 'Active',
    this.department = 'Operations',
    this.joinedDate = '',
    this.checkInTime = '',
    this.checkOutTime = '',
    this.scheduledShift = '',
    this.hoursLogged = '',
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
      empId: empIdVal.isNotEmpty ? empIdVal : 'N/A',
      branch: json['branch']?.toString().isNotEmpty == true ? json['branch'].toString() : 'Main Branch',
      status: json['status']?.toString().isNotEmpty == true ? json['status'].toString() : 'Active',
      department: json['department']?.toString().isNotEmpty == true ? json['department'].toString() : 'Operations',
      joinedDate: json['joinedDate']?.toString() ?? '',
      checkInTime: json['checkInTime']?.toString() ?? '',
      checkOutTime: json['checkOutTime']?.toString() ?? '',
      scheduledShift: json['scheduledShift']?.toString() ?? json['shift']?.toString() ?? '',
      hoursLogged: json['hoursLogged']?.toString() ?? '',
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
      'hoursLogged': calculatedShiftHours,
      'attendanceStatus': attendanceStatus,
      'avatarUrl': avatarUrl,
      'assignedTables': assignedTables,
    };
  }

  /// Dynamic hours calculation based on scheduled shift timings
  String get calculatedShiftHours {
    if (scheduledShift.trim().isEmpty) {
      return hoursLogged.isNotEmpty ? hoursLogged : 'N/A';
    }

    final regExp = RegExp(r'(\d{1,2}):(\d{2})\s*(AM|PM)', caseSensitive: false);
    final matches = regExp.allMatches(scheduledShift).toList();
    if (matches.length >= 2) {
      try {
        final m1 = matches[0];
        final m2 = matches[1];

        int h1 = int.parse(m1.group(1)!);
        int min1 = int.parse(m1.group(2)!);
        String p1 = m1.group(3)!.toUpperCase();

        int h2 = int.parse(m2.group(1)!);
        int min2 = int.parse(m2.group(2)!);
        String p2 = m2.group(3)!.toUpperCase();

        if (p1 == 'PM' && h1 < 12) h1 += 12;
        if (p1 == 'AM' && h1 == 12) h1 = 0;

        if (p2 == 'PM' && h2 < 12) h2 += 12;
        if (p2 == 'AM' && h2 == 12) h2 = 0;

        int startTotal = h1 * 60 + min1;
        int endTotal = h2 * 60 + min2;

        if (endTotal < startTotal) {
          endTotal += 24 * 60; // Overnight shift
        }

        int diffMins = endTotal - startTotal;
        int hours = diffMins ~/ 60;
        int mins = diffMins % 60;

        if (mins > 0) {
          return '${hours}h ${mins.toString().padLeft(2, '0')}m';
        } else {
          return '${hours}h 00m';
        }
      } catch (_) {}
    }

    return hoursLogged.isNotEmpty ? hoursLogged : 'N/A';
  }

  /// Whether the waiter is currently checked in for their shift
  bool get isCheckedIn {
    final statusLower = attendanceStatus.toLowerCase();
    if (statusLower == 'checked out' || statusLower == 'absent' || statusLower == 'off duty') {
      return false;
    }
    return true;
  }
}

