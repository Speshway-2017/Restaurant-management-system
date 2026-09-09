import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/tables_provider.dart';
import 'providers/orders_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main/main_navigation_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FlavoraWaiterApp());
}

class FlavoraWaiterApp extends StatelessWidget {
  const FlavoraWaiterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => TablesProvider()),
        ChangeNotifierProvider(create: (_) => OrdersProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'Flavora Kitchen - Waiter Mobile',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home: _buildHome(auth),
          );
        },
      ),
    );
  }

  Widget _buildHome(AuthProvider auth) {
    if (auth.status == AuthStatus.uninitialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const MainNavigationScreen();
    }

    return const LoginScreen();
  }
}
