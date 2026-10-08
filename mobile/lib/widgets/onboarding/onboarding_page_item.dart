import 'package:flutter/material.dart';

class OnboardingPageData {
  final String title;
  final String subtitle;
  final String? imagePath;
  final Widget customVisual;

  const OnboardingPageData({
    required this.title,
    required this.subtitle,
    this.imagePath,
    required this.customVisual,
  });
}

class OnboardingPageItem extends StatelessWidget {
  final OnboardingPageData pageData;

  const OnboardingPageItem({
    super.key,
    required this.pageData,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: IntrinsicHeight(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(),

                    // Visual Illustration Container
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 340, maxHeight: 280),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFDF8),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: const Color(0xFFE7DCCF),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: (pageData.imagePath != null && pageData.imagePath!.isNotEmpty)
                          ? Image.asset(
                              pageData.imagePath!,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return pageData.customVisual;
                              },
                            )
                          : pageData.customVisual,
                    ),

                    const SizedBox(height: 36),

                    // Title Header
                    Text(
                      pageData.title,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F4D3A),
                        letterSpacing: -0.5,
                        height: 1.25,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 12),

                    // Subtitle Body
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        pageData.subtitle,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF6B7280),
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const Spacer(),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
