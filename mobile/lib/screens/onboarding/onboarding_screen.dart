import 'package:flutter/material.dart';
import '../../services/onboarding_service.dart';
import '../../widgets/onboarding/onboarding_page_item.dart';
import '../../widgets/onboarding/onboarding_visuals.dart';
import '../auth/login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPageData> _pages = const [
    OnboardingPageData(
      title: 'Welcome to Flavora Kitchen',
      subtitle:
          'Your smart waiter companion for faster service and seamless order management.',
      customVisual: WelcomeVisualWidget(),
    ),
    OnboardingPageData(
      title: 'Manage Orders Easily',
      subtitle:
          'View active orders, track order status, and stay updated with real-time order changes.',
      customVisual: OrderManagementVisualWidget(),
    ),
    OnboardingPageData(
      title: 'Serve Customers Faster',
      subtitle:
          'Know when dishes are ready and serve customers without unnecessary delays.',
      customVisual: FasterServiceVisualWidget(),
    ),
    OnboardingPageData(
      title: 'Stay Connected With Your Tables',
      subtitle:
          'Manage tables, view customer orders, and provide a smooth dining experience.',
      customVisual: TableManagementVisualWidget(),
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finishOnboarding() async {
    await OnboardingService.markOnboardingCompleted();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = _currentPage == _pages.length - 1;

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8EE),
      body: Stack(
        children: [
          // 1. Ambient Background Glow (Matching Splash & Login Screens)
          const Positioned.fill(
            child: CustomPaint(
              painter: _OnboardingBackgroundPainter(),
            ),
          ),

          // 2. Main Onboarding Content & Controls
          SafeArea(
            child: Column(
              children: [
                // Top Header Bar with Skip Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Mini Brand Tag
                      const Row(
                        children: [
                          Icon(
                            Icons.restaurant_menu_rounded,
                            size: 20,
                            color: Color(0xFF0F4D3A),
                          ),
                          SizedBox(width: 6),
                          Text(
                            'FLAVORA WAITER',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F4D3A),
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),

                      // Skip Button
                      TextButton(
                        onPressed: _finishOnboarding,
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF0F4D3A),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: const BorderSide(
                              color: Color(0xFFE7DCCF),
                              width: 1,
                            ),
                          ),
                        ),
                        child: const Text(
                          'Skip',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Swipeable PageView Slides
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _pages.length,
                    itemBuilder: (context, index) {
                      return OnboardingPageItem(pageData: _pages[index]);
                    },
                  ),
                ),

                // Bottom Page Indicators & Action Controls
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                  child: Column(
                    children: [
                      // Animated Dots Page Indicator
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 8,
                            width: _currentPage == index ? 24 : 8,
                            decoration: BoxDecoration(
                              color: _currentPage == index
                                  ? const Color(0xFF0F4D3A)
                                  : const Color(0xFFE7DCCF),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Back & Next/Get Started Navigation Buttons Row
                      Row(
                        children: [
                          if (_currentPage > 0) ...[
                            Expanded(
                              flex: 3,
                              child: SizedBox(
                                height: 50,
                                child: OutlinedButton(
                                  onPressed: _previousPage,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFF0F4D3A),
                                    side: const BorderSide(
                                      color: Color(0xFFE7DCCF),
                                      width: 1.5,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(25),
                                    ),
                                  ),
                                  child: const Text(
                                    'Back',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                          ],

                          Expanded(
                            flex: 5,
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _nextPage,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F4D3A),
                                  foregroundColor: Colors.white,
                                  elevation: 4,
                                  shadowColor: const Color(0xFF0F4D3A)
                                      .withValues(alpha: 0.3),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(25),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      isLastPage ? 'Get Started' : 'Next',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.4,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Icon(
                                      isLastPage
                                          ? Icons.check_circle_outline_rounded
                                          : Icons.arrow_forward_rounded,
                                      size: 18,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingBackgroundPainter extends CustomPainter {
  const _OnboardingBackgroundPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paintGreen = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF0F4D3A).withValues(alpha: 0.07),
          const Color(0xFFFFF8EF).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.85, size.height * 0.15),
        radius: size.width * 0.6,
      ));
    canvas.drawCircle(
      Offset(size.width * 0.85, size.height * 0.15),
      size.width * 0.6,
      paintGreen,
    );

    final paintOrange = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFFF8A00).withValues(alpha: 0.12),
          const Color(0xFFFFF8EF).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.15, size.height * 0.8),
        radius: size.width * 0.5,
      ));
    canvas.drawCircle(
      Offset(size.width * 0.15, size.height * 0.8),
      size.width * 0.5,
      paintOrange,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
