import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../core/network/api_client.dart';
import '../core/storage/storage_service.dart';
import '../core/constants/api_constants.dart';

enum AuthStatus { uninitialized, authenticated, unauthenticated, authenticating }

class AuthProvider with ChangeNotifier {
  AuthStatus _status = AuthStatus.uninitialized;
  UserModel? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    final token = await StorageService.getToken();
    final savedUser = await StorageService.getUser();
    if (token != null && token.isNotEmpty && savedUser != null) {
      _user = savedUser;
      _status = AuthStatus.authenticated;
      notifyListeners();
      // Silently refresh profile from backend
      try {
        await refreshProfile();
      } catch (_) {}
    } else {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiConstants.login, body: {
        'email': email.trim(),
        'password': password,
      });

      if (res is Map<String, dynamic>) {
        final token = res['token']?.toString();
        final userData = res['user'];

        if (token != null && userData != null) {
          final userObj = UserModel.fromJson(userData);
          
          // Verify user is Waiter role
          if (!userObj.role.toLowerCase().contains('waiter') &&
              !userObj.role.toLowerCase().contains('staff') &&
              !userObj.role.toLowerCase().contains('manager') &&
              !userObj.role.toLowerCase().contains('admin')) {
            _errorMessage = 'Access denied. Account role is not Waiter.';
            _status = AuthStatus.unauthenticated;
            notifyListeners();
            return false;
          }

          await StorageService.saveToken(token);
          await StorageService.saveUser(userObj);

          _user = userObj;
          _status = AuthStatus.authenticated;
          notifyListeners();
          return true;
        }
      }
      _errorMessage = 'Invalid server response';
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshProfile() async {
    try {
      final res = await ApiClient.get(ApiConstants.getMe);
      if (res is Map<String, dynamic>) {
        final userObj = UserModel.fromJson(res);
        _user = userObj;
        await StorageService.saveUser(userObj);
        notifyListeners();
      }
    } catch (e) {
      // If 401, logout
      if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
        await logout();
      }
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updateData) async {
    try {
      final res = await ApiClient.put(ApiConstants.getMe, body: updateData);
      if (res is Map<String, dynamic>) {
        final userData = res['user'] ?? res;
        if (userData is Map<String, dynamic>) {
          final userObj = UserModel.fromJson(userData);
          _user = userObj;
          await StorageService.saveUser(userObj);
          notifyListeners();
          return true;
        }
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await StorageService.clearSession();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }
}
