import 'package:flutter/material.dart';

class CheckInToggleWidget extends StatelessWidget {
  final bool isCheckedIn;
  final bool isLoading;
  final ValueChanged<bool> onToggle;
  final double width;
  final double height;
  final bool showAvailabilityLabel;

  const CheckInToggleWidget({
    super.key,
    required this.isCheckedIn,
    required this.onToggle,
    this.isLoading = false,
    this.width = 50,
    this.height = 24,
    this.showAvailabilityLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    const padding = 1.8;
    final thumbDiameter = height - (padding * 2);
    final maxSlideDistance = width - thumbDiameter - (padding * 2);

    final neonColor = isCheckedIn
        ? const Color(0xFF00F2FE) // Neon Cyan / Electric Turquoise
        : const Color(0xFFFF2A5F); // Neon Crimson Red

    final toggleBtn = GestureDetector(
      onTap: isLoading ? null : () => onToggle(!isCheckedIn),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: width,
        height: height,
        padding: const EdgeInsets.all(padding),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(height / 2),
          // Metallic Bevel Frame
          gradient: const LinearGradient(
            colors: [
              Color(0xFFE5E7EB),
              Color(0xFF9CA3AF),
              Color(0xFF4B5563),
              Color(0xFF1F2937),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            // Outer Neon Glow Ring around the metallic frame
            BoxShadow(
              color: neonColor.withValues(alpha: 0.45),
              blurRadius: 6,
              spreadRadius: 0.5,
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 3,
              offset: const Offset(0, 1.5),
            ),
          ],
        ),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1F2937), // Dark metallic inner track
            borderRadius: BorderRadius.circular((height - padding * 2) / 2),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Glowing Neon Text "IN" / "OUT"
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.5),
                  child: Row(
                    mainAxisAlignment: isCheckedIn
                        ? MainAxisAlignment.end
                        : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        isCheckedIn ? 'IN' : 'OUT',
                        style: TextStyle(
                          color: neonColor,
                          fontSize: (height * 0.38).clamp(8.0, 10.0),
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.2,
                          shadows: [
                            Shadow(
                              color: neonColor.withValues(alpha: 0.9),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Smooth Metallic Circular Sliding Thumb Knob
              AnimatedPositioned(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                left: isCheckedIn ? 0 : maxSlideDistance,
                top: 0,
                bottom: 0,
                child: Container(
                  width: thumbDiameter,
                  height: thumbDiameter,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    // 3D Silver Metallic Gradient Knob
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFFFFFFFF),
                        Color(0xFFE5E7EB),
                        Color(0xFF9CA3AF),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.45),
                        blurRadius: 3,
                        offset: const Offset(1, 1),
                      ),
                    ],
                  ),
                  child: Center(
                    child: isLoading
                        ? SizedBox(
                            width: thumbDiameter * 0.5,
                            height: thumbDiameter * 0.5,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5,
                              color: neonColor,
                            ),
                          )
                        : null,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (!showAvailabilityLabel) {
      return toggleBtn;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text(
          'Availability ',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(width: 4),
        toggleBtn,
      ],
    );
  }
}
