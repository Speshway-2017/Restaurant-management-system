import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final String initialEmail;

  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  int _step = 1; // Step 1: Request OTP/Link, Step 2: Reset Password, Step 3: Success

  late TextEditingController _emailController;
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureNewPass = true;
  bool _obscureConfirmPass = true;
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
  String? _demoOtp;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final input = _emailController.text.trim();
    if (input.isEmpty || !input.contains('@')) {
      setState(() {
        _errorMessage = 'Please enter a valid registered email address.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final res = await ApiClient.post(ApiConstants.forgotPassword, body: {'email': input});
      setState(() {
        _isLoading = false;
        if (res is Map) {
          _successMessage = res['message']?.toString() ?? 'Password reset OTP sent successfully.';
          if (res['otp'] != null) {
            _demoOtp = res['otp'].toString();
          }
        } else {
          _successMessage = 'Password reset OTP sent to your registered account.';
        }
        _step = 2;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _handleResetPassword() async {
    final otp = _otpController.text.trim();
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (otp.isEmpty) {
      setState(() => _errorMessage = 'Please enter the 6-digit OTP code.');
      return;
    }
    if (newPass.length < 6) {
      setState(() => _errorMessage = 'New password must be at least 6 characters long.');
      return;
    }
    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'Passwords do not match. Please re-enter matching passwords.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final res = await ApiClient.post(ApiConstants.resetPassword, body: {
        'email': _emailController.text.trim(),
        'otp': otp,
        'newPassword': newPass,
      });
      setState(() {
        _isLoading = false;
        if (res is Map && res['message'] != null) {
          _successMessage = res['message'].toString();
        } else {
          _successMessage = 'Password reset successful! You can now sign in with your new password.';
        }
        _step = 3;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4EC), // Clean Warm Cream
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar (Back to Sign In Button)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                      child: Row(
                        children: [
                          Icon(Icons.arrow_back_rounded, size: 20, color: Color(0xFF1E293B)),
                          SizedBox(width: 6),
                          Text(
                            'Back to Sign In',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Main Scrollable Area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: Column(
                      children: [
                        const SizedBox(height: 6),

                        // Main Unified Card Container (Branding + Reset Password Form)
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              // Brand Logo Container (Inside Card)
                              Container(
                                width: 86,
                                height: 86,
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (ctx, err, stack) {
                                    return const Icon(Icons.restaurant_outlined, size: 32, color: Color(0xFF0F3526));
                                  },
                                ),
                              ),
                              const SizedBox(height: 10),

                              // Flavora Kitchen Brand Name Text
                              RichText(
                                textAlign: TextAlign.center,
                                text: const TextSpan(
                                  children: [
                                    TextSpan(
                                      text: 'Flavora ',
                                      style: TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w900,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFFD95D27), // Terracotta Orange
                                        letterSpacing: -0.5,
                                      ),
                                    ),
                                    TextSpan(
                                      text: 'Kitchen',
                                      style: TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w900,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFF1E293B), // Dark Charcoal
                                        letterSpacing: -0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),

                              // Tagline (Inside Card)
                              const Text(
                                'GOOD FOOD GREAT MOMENTS',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFD95D27), // Terracotta Orange
                                  letterSpacing: 2.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),

                              // Top Yellow Key Badge
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7), // Light Warm Yellow
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(
                                  Icons.vpn_key_rounded,
                                  color: Color(0xFFD95D27), // Terracotta Orange
                                  size: 26,
                                ),
                              ),
                              const SizedBox(height: 14),

                              // Title
                              Text(
                                _step == 1
                                    ? 'Forgot Password?'
                                    : _step == 2
                                        ? 'Reset Password'
                                        : 'Password Reset Complete!',
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0F3526),
                                  letterSpacing: -0.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),

                              // Subtitle Text
                              Text(
                                _step == 1
                                    ? "No worries! Enter your registered email address and we'll send you an OTP / reset link to recover your account."
                                    : _step == 2
                                        ? 'Enter the 6-digit OTP code sent to your registered account along with your new password.'
                                        : 'Your password has been successfully updated. You can now log in with your new credentials.',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF64748B),
                                  height: 1.4,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 20),

                              // Feedback Banners (Error / Success)
                              if (_errorMessage != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF2F2),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFFCA5A5)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 20),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          _errorMessage!,
                                          style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              if (_successMessage != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFF86EFAC)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF166534), size: 20),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          _successMessage!,
                                          style: const TextStyle(color: Color(0xFF14532D), fontSize: 13, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              if (_demoOtp != null && _step == 2) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFF93C5FD)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.info_outline_rounded, color: Color(0xFF1D4ED8), size: 20),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          'Demo Mode OTP Code: $_demoOtp',
                                          style: const TextStyle(color: Color(0xFF1E40AF), fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              // STEP 1: Enter Email
                              if (_step == 1) ...[
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'Email Address',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1E293B),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),

                                TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                                  decoration: InputDecoration(
                                    hintText: 'e.g. manager@flavorakitchen.com',
                                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    prefixIcon: const Icon(
                                      Icons.mail_outline_rounded,
                                      color: Color(0xFF94A3B8),
                                      size: 20,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Color(0xFF0F3526), width: 1.8),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // Action Button
                                SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F3526),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    ),
                                    onPressed: _isLoading ? null : _handleSendOtp,
                                    child: _isLoading
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                          )
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'Send Reset Link / OTP',
                                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.2),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(Icons.arrow_forward_rounded, size: 18),
                                            ],
                                          ),
                                  ),
                                ),
                              ],

                              // STEP 2: Enter OTP & New Password
                              if (_step == 2) ...[
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text('Enter 6-Digit OTP Code', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 4),
                                  decoration: InputDecoration(
                                    hintText: '123456',
                                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8), letterSpacing: 1),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    prefixIcon: const Icon(Icons.pin_outlined, color: Color(0xFF94A3B8), size: 20),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0F3526), width: 1.8)),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text('New Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _newPasswordController,
                                  obscureText: _obscureNewPass,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                  decoration: InputDecoration(
                                    hintText: 'Enter new password',
                                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF94A3B8), size: 20),
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscureNewPass ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: const Color(0xFF94A3B8), size: 20),
                                      onPressed: () => setState(() => _obscureNewPass = !_obscureNewPass),
                                    ),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0F3526), width: 1.8)),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text('Confirm New Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _confirmPasswordController,
                                  obscureText: _obscureConfirmPass,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                  decoration: InputDecoration(
                                    hintText: 'Re-enter new password',
                                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    prefixIcon: const Icon(Icons.lock_clock_outlined, color: Color(0xFF94A3B8), size: 20),
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscureConfirmPass ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: const Color(0xFF94A3B8), size: 20),
                                      onPressed: () => setState(() => _obscureConfirmPass = !_obscureConfirmPass),
                                    ),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0F3526), width: 1.8)),
                                  ),
                                ),
                                const SizedBox(height: 20),

                                SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F3526),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    ),
                                    onPressed: _isLoading ? null : _handleResetPassword,
                                    child: _isLoading
                                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text('Reset Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.2)),
                                              SizedBox(width: 8),
                                              Icon(Icons.arrow_forward_rounded, size: 18),
                                            ],
                                          ),
                                  ),
                                ),
                              ],

                              // STEP 3: Success Screen
                              if (_step == 3) ...[
                                SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F3526),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    ),
                                    onPressed: () => Navigator.pop(context),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text('Back to Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.2)),
                                        SizedBox(width: 8),
                                        Icon(Icons.arrow_forward_rounded, size: 18),
                                      ],
                                    ),
                                  ),
                                ),
                              ],

                              const SizedBox(height: 20),

                              // Card Footer Administrator Link
                              RichText(
                                textAlign: TextAlign.center,
                                text: const TextSpan(
                                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                  children: [
                                    TextSpan(text: 'Having trouble? '),
                                    TextSpan(
                                      text: 'Contact your administrator',
                                      style: TextStyle(
                                        color: Color(0xFFD95D27), // Terracotta Orange
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Security Badge
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.check_circle_rounded, color: Color(0xFF166534), size: 16),
                                  SizedBox(width: 6),
                                  Text(
                                    'Secure 256-Bit SSL Encrypted Verification',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Integrated Management Suite Quick Chips
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildSuiteFeatureChip(Icons.add_circle_outline_rounded, 'Smart Ordering'),
                            _buildSuiteFeatureChip(Icons.menu_book_rounded, 'Live Kitchen'),
                            _buildSuiteFeatureChip(Icons.table_restaurant_rounded, 'Table Mgmt'),
                            _buildSuiteFeatureChip(Icons.bar_chart_rounded, 'Analytics'),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Enterprise Grade Resilience Dark Card Banner
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F3526), // Dark Forest Green
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F3526).withValues(alpha: 0.3),
                                blurRadius: 14,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // 100% SYNCED Badge Box
                              Container(
                                width: 68,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF164E38), // Slightly lighter emerald inside banner
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '100%',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFD95D27), // Terracotta Orange
                                      ),
                                    ),
                                    Text(
                                      'SYNCED',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Details
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.circle, color: Color(0xFF22C55E), size: 7),
                                        SizedBox(width: 6),
                                        Text(
                                          'ENTERPRISE GRADE RESILIENCE',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFD95D27),
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 3),
                                    Text(
                                      'Continuous Encrypted Backup & POS Avail...',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Fast disaster recovery with 99.99% operational SLA',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.white70,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom Feature Footer Bar
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              decoration: const BoxDecoration(
                color: Color(0xFFEFE9DE), // Warm Light Tan
                border: Border(top: BorderSide(color: Color(0xFFE2D7C7))),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _FooterFeatureItem(icon: Icons.shield_outlined, label: 'Encrypted & Compliant'),
                  _FooterFeatureItem(icon: Icons.access_time_rounded, label: '24/7 Dedicated RMS Support'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuiteFeatureChip(IconData icon, String label) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Icon(icon, size: 20, color: const Color(0xFF1E293B)),
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
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
            ),
          ),
        ],
      ),
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
          Icon(icon, size: 14, color: const Color(0xFF475569)),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF334155),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
