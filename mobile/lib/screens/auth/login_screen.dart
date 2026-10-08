import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../main/main_navigation_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      if (!_acceptedTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.gpp_maybe_outlined, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Please accept the Terms & Conditions and Privacy Policy to proceed.',
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.cancelledText,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        return;
      }

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      if (success && mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
          (route) => false,
        );
      } else if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    authProvider.errorMessage ?? 'Invalid email or password.',
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.cancelledText,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    }
  }

  void _showTermsModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: const Color(0xFFFFF8EF),
        title: const Row(
          children: [
            Icon(Icons.description_outlined, color: Color(0xFF0F4D3A)),
            SizedBox(width: 8),
            Text(
              'Terms & Conditions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F4D3A),
              ),
            ),
          ],
        ),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Flavora Kitchen - RMS Terms of Service',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F4D3A)),
              ),
              SizedBox(height: 8),
              Text(
                '1. Authorized Staff Access: This application is intended exclusively for authorized restaurant staff, waiters, and kitchen personnel of Flavora Kitchen.\n\n'
                '2. Account Security: Users are responsible for keeping their account credentials confidential. Any activity conducted under your login ID is your responsibility.\n\n'
                '3. Order Accuracy: Staff must verify order details, table assignments, and customer requests accurately before sending orders to the kitchen or generating bills.\n\n'
                '4. Real-Time System Integrity: Unauthorized manipulation of order statuses, prices, or table availability is strictly prohibited.\n\n'
                '5. Policy Updates: Flavora Kitchen reserves the right to update these terms at any time to ensure security and operational excellence.',
                style: TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.4),
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F4D3A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('I Understand', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showPrivacyModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: const Color(0xFFFFF8EF),
        title: const Row(
          children: [
            Icon(Icons.privacy_tip_outlined, color: Color(0xFF0F4D3A)),
            SizedBox(width: 8),
            Text(
              'Privacy Policy',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F4D3A),
              ),
            ),
          ],
        ),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Flavora Kitchen - Data Privacy Notice',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F4D3A)),
              ),
              SizedBox(height: 8),
              Text(
                '1. Data Collection: We process essential operational data including staff authentication tokens, attendance timestamps, table assignments, and order logs.\n\n'
                '2. Purpose of Processing: Information collected is strictly used for order processing, table status management, kitchen display routing, and staff attendance tracking.\n\n'
                '3. Data Protection: All sensitive information is encrypted in transit and stored securely in compliance with system standards.\n\n'
                '4. Third-Party Sharing: Operational data is kept private within Flavora Kitchen systems and is never sold or shared with external third parties.',
                style: TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.4),
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F4D3A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _navigateToForgotPasswordScreen(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) =>
            ForgotPasswordScreen(initialEmail: _emailController.text.trim()),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isAuthLoading = authProvider.status == AuthStatus.authenticating;

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8EE),
      body: Stack(
        children: [
          // 1. Full-Screen Background Image (Shared directly with Splash Screen)
          Positioned.fill(
            child: Image.asset(
              'assets/images/splash_screen.jpg',
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
              alignment: Alignment.center,
              errorBuilder: (ctx, err, stack) {
                return Container(
                  color: const Color(0xFFFDF8EE),
                  child: CustomPaint(
                    painter: LoginBackgroundPainter(),
                  ),
                );
              },
            ),
          ),

          // 2. Subtle Dark Vignette Overlay for image depth and contrast
          Positioned.fill(
            child: Container(
              color: Colors.black.withValues(alpha: 0.15),
            ),
          ),

          // 3. Foreground Content with Floating Warm Cream Card Container
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 440),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 24,
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const SizedBox(height: 12),

                                // Warm Cream Floating Card Container (Matches Splash Screen Visual Language)
                                Container(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF8EF),
                                    borderRadius: BorderRadius.circular(28),
                                    border: Border.all(
                                      color: const Color(0xFFE7DCCF),
                                      width: 1.5,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.22),
                                        blurRadius: 30,
                                        offset: const Offset(0, 12),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 26,
                                  ),
                                  child: Form(
                                    key: _formKey,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        // Flavora Logo Emblem Container (Matches Splash Logo Container)
                                        Container(
                                          width: 90,
                                          height: 90,
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFFDF8),
                                            borderRadius: BorderRadius.circular(22),
                                            border: Border.all(
                                              color: const Color(0xFFE7DCCF),
                                              width: 1,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: const Color(0xFF0F4D3A)
                                                    .withValues(alpha: 0.08),
                                                blurRadius: 12,
                                                offset: const Offset(0, 4),
                                              ),
                                            ],
                                          ),
                                          child: Image.asset(
                                            'assets/images/logo.png',
                                            fit: BoxFit.contain,
                                            errorBuilder: (ctx, err, stack) {
                                              return const Icon(
                                                Icons.restaurant_outlined,
                                                size: 40,
                                                color: Color(0xFF0F4D3A),
                                              );
                                            },
                                          ),
                                        ),
                                        const SizedBox(height: 12),

                                        // Brand Header Text
                                        RichText(
                                          textAlign: TextAlign.center,
                                          text: const TextSpan(
                                            children: [
                                              TextSpan(
                                                text: 'Flavora ',
                                                style: TextStyle(
                                                  fontSize: 26,
                                                  fontWeight: FontWeight.bold,
                                                  fontStyle: FontStyle.italic,
                                                  color: Color(0xFFF36F0A),
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                              TextSpan(
                                                text: 'Kitchen',
                                                style: TextStyle(
                                                  fontSize: 26,
                                                  fontWeight: FontWeight.bold,
                                                  fontStyle: FontStyle.italic,
                                                  color: Color(0xFF0F4D3A),
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 4),

                                        // Tagline matching Splash Screen
                                        const Text(
                                          'GOOD FOOD. GREAT MOMENTS.',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFD97706),
                                            letterSpacing: 2.2,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 16),

                                        // Header Title & Subtitle
                                        const Text(
                                          'Welcome Back!',
                                          style: TextStyle(
                                            fontSize: 28,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF0F4D3A),
                                            letterSpacing: -0.5,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 4),
                                        const Text(
                                          'Sign in to continue to your RMS account',
                                          style: TextStyle(
                                            fontSize: 13.5,
                                            color: Color(0xFF6B7280),
                                            fontWeight: FontWeight.w500,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 24),

                                        // Email Field Label & Input
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: _buildLabel('Email Address'),
                                        ),
                                        const SizedBox(height: 6),
                                        _buildTextField(
                                          controller: _emailController,
                                          hint: 'Enter email address',
                                          icon: Icons.mail_outline_rounded,
                                          keyboardType: TextInputType.emailAddress,
                                          validator: (val) {
                                            if (val == null || val.trim().isEmpty) {
                                              return 'Please enter email address';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 16),

                                        // Password Field Label & Input
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: _buildLabel('Password'),
                                        ),
                                        const SizedBox(height: 6),
                                        _buildTextField(
                                          controller: _passwordController,
                                          hint: 'Enter your password',
                                          icon: Icons.lock_outline_rounded,
                                          obscureText: _obscurePassword,
                                          suffixIcon: IconButton(
                                            icon: Icon(
                                              _obscurePassword
                                                  ? Icons.visibility_outlined
                                                  : Icons.visibility_off_outlined,
                                              color: const Color(0xFF6B7280),
                                              size: 20,
                                            ),
                                            onPressed: () {
                                              setState(() {
                                                _obscurePassword = !_obscurePassword;
                                              });
                                            },
                                          ),
                                          validator: (val) {
                                            if (val == null || val.trim().isEmpty) {
                                              return 'Please enter password';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 14),

                                        // Remember Me & Forgot Password Row
                                        Wrap(
                                          alignment: WrapAlignment.spaceBetween,
                                          crossAxisAlignment: WrapCrossAlignment.center,
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                SizedBox(
                                                  width: 20,
                                                  height: 20,
                                                  child: Checkbox(
                                                    value: _rememberMe,
                                                    activeColor: const Color(0xFF0F4D3A),
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    onChanged: (val) {
                                                      setState(() {
                                                        _rememberMe = val ?? true;
                                                      });
                                                    },
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                const Text(
                                                  'Remember me',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    color: Color(0xFF374151),
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            GestureDetector(
                                              onTap: () =>
                                                  _navigateToForgotPasswordScreen(context),
                                              child: const Text(
                                                'Forgot Password?',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Color(0xFFF36F0A),
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        _buildTermsCheckboxRow(),
                                        const SizedBox(height: 18),

                                        // Sign In CTA Button (Matching Splash Button Style)
                                        SizedBox(
                                          width: double.infinity,
                                          height: 54,
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF0F4D3A),
                                              foregroundColor: Colors.white,
                                              elevation: 4,
                                              shadowColor: const Color(0xFF0F4D3A)
                                                  .withValues(alpha: 0.35),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(28),
                                              ),
                                            ),
                                            onPressed: isAuthLoading ? null : _handleLogin,
                                            child: isAuthLoading
                                                ? const SizedBox(
                                                    width: 22,
                                                    height: 22,
                                                    child: CircularProgressIndicator(
                                                      color: Colors.white,
                                                      strokeWidth: 2.5,
                                                    ),
                                                  )
                                                : const Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment.center,
                                                    children: [
                                                      Text(
                                                        'Sign In',
                                                        style: TextStyle(
                                                          fontSize: 16.5,
                                                          fontWeight: FontWeight.bold,
                                                          letterSpacing: 0.5,
                                                        ),
                                                      ),
                                                      SizedBox(width: 8),
                                                      Icon(
                                                        Icons.arrow_forward_rounded,
                                                        size: 20,
                                                      ),
                                                    ],
                                                  ),
                                          ),
                                        ),
                                        const SizedBox(height: 24),

                                        // Suite Divider Line
                                        const Row(
                                          children: [
                                            Expanded(
                                              child: Divider(
                                                color: Color(0xFFE7DCCF),
                                                thickness: 1,
                                              ),
                                            ),
                                            Padding(
                                              padding: EdgeInsets.symmetric(
                                                  horizontal: 10),
                                              child: Text(
                                                'INTEGRATED MANAGEMENT SUITE',
                                                style: TextStyle(
                                                  fontSize: 10.5,
                                                  fontWeight: FontWeight.w800,
                                                  color: Color(0xFF6B7280),
                                                  letterSpacing: 1.1,
                                                ),
                                              ),
                                            ),
                                            Expanded(
                                              child: Divider(
                                                color: Color(0xFFE7DCCF),
                                                thickness: 1,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),

                                        // 4 Feature Suite Quick Chips
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: [
                                            Expanded(
                                              child: _buildSuiteFeatureChip(
                                                icon: Icons.touch_app_rounded,
                                                label: 'Smart Ordering',
                                                iconColor: const Color(0xFFF36F0A),
                                                bgColor: const Color(0xFFFFE7D2),
                                                borderColor: const Color(0xFFFFCFA5),
                                              ),
                                            ),
                                            Expanded(
                                              child: _buildSuiteFeatureChip(
                                                icon: Icons.soup_kitchen_rounded,
                                                label: 'Live Kitchen',
                                                iconColor: const Color(0xFF0F4D3A),
                                                bgColor: const Color(0xFFDDEFE5),
                                                borderColor: const Color(0xFFBBE0CD),
                                              ),
                                            ),
                                            Expanded(
                                              child: _buildSuiteFeatureChip(
                                                icon: Icons.table_restaurant_rounded,
                                                label: 'Table Mgmt',
                                                iconColor: const Color(0xFFD97706),
                                                bgColor: const Color(0xFFFFF0C7),
                                                borderColor: const Color(0xFFFFE38E),
                                              ),
                                            ),
                                            Expanded(
                                              child: _buildSuiteFeatureChip(
                                                icon: Icons.insights_rounded,
                                                label: 'Analytics',
                                                iconColor: const Color(0xFF4F46E5),
                                                bgColor: const Color(0xFFE6E9FF),
                                                borderColor: const Color(0xFFC5CBFF),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 20),

                                        // Bottom Feature Footer Bar Container
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 12,
                                            horizontal: 14,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF5ECE0),
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(
                                              color: const Color(0xFFE7DCCF),
                                            ),
                                          ),
                                          child: const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceAround,
                                            children: [
                                              _FooterFeatureItem(
                                                icon: Icons.apartment_rounded,
                                                label: 'Multi-Branch',
                                              ),
                                              _FooterFeatureItem(
                                                icon: Icons.gpp_good_outlined,
                                                label: 'Secure RMS',
                                              ),
                                              _FooterFeatureItem(
                                                icon: Icons.support_agent_rounded,
                                                label: '24/7 Support',
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermsCheckboxRow() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: _acceptedTerms,
                activeColor: const Color(0xFF0F4D3A),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
                onChanged: (val) {
                  setState(() {
                    _acceptedTerms = val ?? false;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: Color(0xFF374151),
                    fontWeight: FontWeight.w500,
                  ),
                  children: [
                    const TextSpan(text: 'I agree to '),
                    TextSpan(
                      text: 'Terms & Conditions',
                      style: const TextStyle(
                        color: Color(0xFFF36F0A),
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => _showTermsModal(context),
                    ),
                    const TextSpan(text: ' & '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: const TextStyle(
                        color: Color(0xFFF36F0A),
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => _showPrivacyModal(context),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.bold,
        color: Color(0xFF0F4D3A),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(
        fontSize: 14.5,
        fontWeight: FontWeight.w600,
        color: Color(0xFF1F2937),
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
          fontSize: 14,
          color: Color(0xFF9CA3AF),
          fontWeight: FontWeight.normal,
        ),
        filled: true,
        fillColor: const Color(0xFFFFFDF8),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        prefixIcon: Icon(icon, color: const Color(0xFF0F4D3A), size: 20),
        suffixIcon: suffixIcon,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: Color(0xFFE7DCCF)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: Color(0xFFE7DCCF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: Color(0xFF0F4D3A), width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
      ),
    );
  }

  Widget _buildSuiteFeatureChip({
    required IconData icon,
    required String label,
    required Color iconColor,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Column(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: bgColor,
            border: Border.all(color: borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: iconColor.withValues(alpha: 0.15),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Icon(icon, size: 22, color: iconColor),
        ),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              maxLines: 1,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF374151),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FooterFeatureItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FooterFeatureItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Flexible(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF0F4D3A)),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CUSTOM PAINTER FOR SOFT AMBIENT BACKGROUND GLOW (FALLBACK MATCHING SPLASH)
// ─────────────────────────────────────────────────────────────────────────
class LoginBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintGreen = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF0F4D3A).withValues(alpha: 0.08),
          const Color(0xFFFFF8EF).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.15, size.height * 0.12),
        radius: size.width * 0.6,
      ));
    canvas.drawCircle(
      Offset(size.width * 0.15, size.height * 0.12),
      size.width * 0.6,
      paintGreen,
    );

    final paintOrange = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFFF8A00).withValues(alpha: 0.14),
          const Color(0xFFFFF8EF).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.5, size.height * 0.45),
        radius: size.width * 0.5,
      ));
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.45),
      size.width * 0.5,
      paintOrange,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
