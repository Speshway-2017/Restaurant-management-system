import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../screens/auth/login_screen.dart';

class GuestGuard {
  /// Checks if current user is in Guest Mode.
  /// If in Guest Mode, shows a friendly snackbar informing them to sign in,
  /// and returns `true` (restricted). Otherwise returns `false` (allowed).
  static bool checkGuestRestriction(BuildContext context, {String action = 'perform this action'}) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isGuestMode) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.lock_outline_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Please sign in as a waiter to $action.',
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFD97706), // Warm amber warning color
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          action: SnackBarAction(
            label: 'Sign In',
            textColor: Colors.white,
            onPressed: () {
              auth.exitGuestMode();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ),
      );
      return true;
    }
    return false;
  }

  /// Builds a prominent, non-intrusive Guest Mode banner for screen headers.
  static Widget buildGuestBanner(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    if (!auth.isGuestMode) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
      decoration: const BoxDecoration(
        color: Color(0xFFFFF0C7),
        border: Border(
          bottom: BorderSide(color: Color(0xFFFFE38E), width: 1),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_clock_outlined, size: 18, color: Color(0xFFB45309)),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Guest Mode â€¢ Limited Access (Read-Only)',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: Color(0xFF92400E),
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              auth.exitGuestMode();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF0F4D3A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Sign In',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
