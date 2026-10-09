import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../core/network/api_client.dart';
import '../core/storage/storage_service.dart';
import '../core/constants/api_constants.dart';
import '../core/network/socket_service.dart';

enum AuthStatus { uninitialized, authenticated, unauthenticated, authenticating, guest }

class AuthProvider with ChangeNotifier {
  AuthStatus _status = AuthStatus.uninitialized;
  UserModel? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isGuestMode => _status == AuthStatus.guest;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    final token = await StorageService.getToken();
    final savedUser = await StorageService.getUser();
    final isGuest = await StorageService.isGuestMode();

    if (token != null && token.isNotEmpty && savedUser != null) {
      final role = savedUser.role.toString().trim().toLowerCase();
      if (role != 'waiter') {
        await StorageService.clearSession();
        _user = null;
        _errorMessage = 'Invalid Waiter Credentials.';
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }
      await StorageService.clearGuestMode();
      _user = savedUser;
      _status = AuthStatus.authenticated;
      notifyListeners();
      // Silently refresh profile from backend
      try {
        await refreshProfile();
      } catch (_) {}
    } else if (isGuest) {
      _user = null;
      _status = AuthStatus.guest;
      notifyListeners();
    } else {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> enterGuestMode() async {
    await StorageService.clearSession();
    await StorageService.saveGuestMode(true);
    _user = null;
    _status = AuthStatus.guest;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> exitGuestMode() async {
    SocketService.disconnect();
    await StorageService.clearGuestMode();
    await StorageService.clearSession();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiConstants.login, body: {
        'email': email.trim(),
        'password': password,
        'client': 'waiter_mobile',
        'app': 'waiter',
        'requiredRole': 'waiter',
      });

      if (res is Map<String, dynamic>) {
        final token = res['token']?.toString() ?? (res['data'] is Map ? (res['data'] as Map)['token']?.toString() : null);
        Map<String, dynamic>? userData;
        if (res['user'] is Map<String, dynamic>) {
          userData = res['user'] as Map<String, dynamic>;
        } else if (res['data'] is Map && (res['data'] as Map)['user'] is Map<String, dynamic>) {
          userData = (res['data'] as Map)['user'] as Map<String, dynamic>;
        } else if (res['data'] is Map<String, dynamic>) {
          userData = res['data'] as Map<String, dynamic>;
        }

        if (token != null && userData != null) {
          final userObj = UserModel.fromJson(userData);
          final role = userObj.role.toString().trim().toLowerCase();
          
          // Verify user is strictly Waiter role
          if (role != 'waiter') {
            await StorageService.clearSession();
            _user = null;
            _errorMessage = 'Access denied. This app is only for waiter accounts.';
            _status = AuthStatus.unauthenticated;
            notifyListeners();
            return false;
          }

          await StorageService.saveToken(token);
          await StorageService.saveUser(userObj);
          await StorageService.clearGuestMode();

          _user = userObj;
          _status = AuthStatus.authenticated;
          notifyListeners();
          return true;
        }
      }
      _errorMessage = (res is Map && res.containsKey('message'))
          ? res['message'].toString()
          : 'Invalid server response';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      final errStr = e.toString().replaceAll('Exception: ', '');
      if (errStr.toLowerCase().contains('waiter') || errStr.toLowerCase().contains('access denied')) {
        _errorMessage = 'Access denied. This app is only for waiter accounts.';
      } else {
        _errorMessage = errStr;
      }
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshProfile() async {
    try {
      final res = await ApiClient.get(ApiConstants.getMe);
      if (res is Map<String, dynamic>) {
        final Map<String, dynamic> userData;
        if (res['user'] is Map<String, dynamic>) {
          userData = res['user'] as Map<String, dynamic>;
        } else if (res['data'] is Map && (res['data'] as Map)['user'] is Map<String, dynamic>) {
          userData = (res['data'] as Map)['user'] as Map<String, dynamic>;
        } else {
          userData = res;
        }

        if (userData.containsKey('name') || userData.containsKey('email') || userData.containsKey('_id') || userData.containsKey('id')) {
          final userObj = UserModel.fromJson(userData);
          final role = userObj.role.toString().trim().toLowerCase();
          if (role != 'waiter') {
            await logout();
            _errorMessage = 'Access denied. This app is only for waiter accounts.';
            notifyListeners();
            return;
          }
          _user = userObj;
          await StorageService.saveUser(userObj);
          notifyListeners();
        }
      }
      await fetchAttendanceStatus();
    } catch (e) {
      // If 401/403, logout
      if (e.toString().contains('401') || e.toString().contains('Unauthorized') || e.toString().contains('403')) {
        await logout();
      }
    }
  }

  Future<void> fetchAttendanceStatus() async {
    try {
      final res = await ApiClient.get(ApiConstants.staffMyStatus);
      if (kDebugMode) {
        print('[Attendance] fetchAttendanceStatus response: $res');
      }
      if (res is Map<String, dynamic> && _user != null) {
        final isCheckedIn = res['isCheckedIn'] == true || res['status'] == 'available' || res['dutyStatus'] == 'LOGGED_IN';
        final statusStr = isCheckedIn ? 'Present' : 'Checked Out';
        if (_user!.attendanceStatus != statusStr) {
          _user = UserModel.fromJson({
            ..._user!.toJson(),
            'attendanceStatus': statusStr,
          });
          await StorageService.saveUser(_user!);
          notifyListeners();
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('[Attendance] Error fetching my status: $e');
      }
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updateData) async {
    try {
      final res = await ApiClient.put(ApiConstants.getMe, body: updateData);
      if (res is Map<String, dynamic>) {
        final Map<String, dynamic> userData;
        if (res['user'] is Map<String, dynamic>) {
          userData = res['user'] as Map<String, dynamic>;
        } else if (res['data'] is Map && (res['data'] as Map)['user'] is Map<String, dynamic>) {
          userData = (res['data'] as Map)['user'] as Map<String, dynamic>;
        } else {
          userData = res;
        }

        final userObj = UserModel.fromJson(userData);
        _user = userObj;
        await StorageService.saveUser(userObj);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> checkIn() async {
    if (kDebugMode) {
      print('[Attendance] Check IN button clicked');
      print('[Attendance] API URL: ${ApiConstants.baseUrl}${ApiConstants.staffCheckIn}');
      print('[Attendance] User ID: ${_user?.id}');
      print('[Attendance] Role: ${_user?.role}');
    }

    try {
      final res = await ApiClient.post(ApiConstants.staffCheckIn);
      if (kDebugMode) {
        print('[Attendance] Check IN response: $res');
      }

      if (res is Map<String, dynamic> && (res['success'] == true || res['attendance'] != null)) {
        if (_user != null) {
          final nowStr = _formatCurrentTime();
          _user = UserModel.fromJson({
            ..._user!.toJson(),
            'attendanceStatus': 'Present',
            'checkInTime': nowStr,
          });
          await StorageService.saveUser(_user!);
        }
        SocketService.updateCheckInStatus(true);
        notifyListeners();
        return true;
      } else {
        _errorMessage = (res is Map && res.containsKey('message')) ? res['message'] : 'Check IN failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      if (kDebugMode) {
        print('[Attendance] Check IN error: $e');
      }
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> checkOut() async {
    if (kDebugMode) {
      print('[Attendance] Check OUT button clicked');
      print('[Attendance] API URL: ${ApiConstants.baseUrl}${ApiConstants.staffCheckOut}');
      print('[Attendance] User ID: ${_user?.id}');
      print('[Attendance] Role: ${_user?.role}');
    }

    try {
      final res = await ApiClient.post(ApiConstants.staffCheckOut);
      if (kDebugMode) {
        print('[Attendance] Check OUT response: $res');
      }

      if (res is Map<String, dynamic> && (res['success'] == true || res['attendance'] != null)) {
        if (_user != null) {
          final nowStr = _formatCurrentTime();
          _user = UserModel.fromJson({
            ..._user!.toJson(),
            'attendanceStatus': 'Checked Out',
            'checkOutTime': nowStr,
          });
          await StorageService.saveUser(_user!);
        }
        SocketService.updateCheckInStatus(false);
        notifyListeners();
        return true;
      } else {
        _errorMessage = (res is Map && res.containsKey('message')) ? res['message'] : 'Check OUT failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      if (kDebugMode) {
        print('[Attendance] Check OUT error: $e');
      }
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  String _formatCurrentTime() {
    final now = DateTime.now();
    final hour = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final minute = now.minute.toString().padLeft(2, '0');
    final period = now.hour >= 12 ? 'PM' : 'AM';
    return '${hour.toString().padLeft(2, '0')}:$minute $period';
  }

  Future<void> logout() async {
    SocketService.disconnect();
    await StorageService.clearSession();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }
}
