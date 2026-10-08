import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/tables_provider.dart';
import 'providers/orders_provider.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main/main_navigation_screen.dart';

import 'screens/onboarding/onboarding_screen.dart';
import 'services/onboarding_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // 🔔 Request Firebase Push Notification Permissions
    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('Firebase Notification Permission status: ${settings.authorizationStatus}');
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }
  runApp(const FlavoraWaiterApp());
}

class FlavoraWaiterApp extends StatefulWidget {
  const FlavoraWaiterApp({super.key});

  @override
  State<FlavoraWaiterApp> createState() => _FlavoraWaiterAppState();
}

class _FlavoraWaiterAppState extends State<FlavoraWaiterApp> {
  bool _splashCompleted = false;

  void _handleSplashCompleted() {
    if (mounted) {
      setState(() {
        _splashCompleted = true;
      });
    }
  }

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
    if (!_splashCompleted) {
      return SplashScreen(
        onComplete: _handleSplashCompleted,
      );
    }

    if (auth.status == AuthStatus.uninitialized) {
      return const Scaffold(
        backgroundColor: Color(0xFF0F3526),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFFF8A00)),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const MainNavigationScreen();
    }

    return FutureBuilder<bool>(
      future: OnboardingService.isOnboardingCompleted(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            backgroundColor: Color(0xFFFDF8EE),
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFF0F4D3A)),
            ),
          );
        }

        final completed = snapshot.data ?? false;
        if (!completed) {
          return const OnboardingScreen();
        }

        return const LoginScreen();
      },
    );
  }
}
