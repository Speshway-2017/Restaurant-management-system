import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/constants/app_colors.dart';

class UserAvatarWidget extends StatelessWidget {
  final String? avatarUrl;
  final String name;
  final double radius;
  final Color? backgroundColor;
  final Color? textColor;
  final Border? border;

  const UserAvatarWidget({
    super.key,
    this.avatarUrl,
    required this.name,
    this.radius = 24,
    this.backgroundColor,
    this.textColor,
    this.border,
  });

  String _fullUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final base = ApiConstants.baseUrl.replaceAll('/api', '');
    if (path.startsWith('/')) {
      return '$base$path';
    }
    return '$base/$path';
  }

  Uint8List? _tryParseBase64(String str) {
    try {
      String cleanStr = str;
      if (str.contains(';base64,')) {
        cleanStr = str.split(';base64,')[1];
      }
      return base64Decode(cleanStr.trim());
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = radius * 2;
    final initial = (name.isNotEmpty ? name[0] : 'W').toUpperCase();
    final defaultBg = backgroundColor ?? AppColors.darkGreen;
    final defaultText = textColor ?? Colors.white;

    Widget childContent;

    final url = avatarUrl?.trim() ?? '';

    if (url.isNotEmpty) {
      if (url.startsWith('data:image/') || (url.length > 100 && !url.startsWith('http'))) {
        final bytes = _tryParseBase64(url);
        if (bytes != null && bytes.isNotEmpty) {
          childContent = Image.memory(
            bytes,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildInitials(initial, defaultText),
          );
        } else {
          childContent = _buildInitials(initial, defaultText);
        }
      } else {
        childContent = Image.network(
          _fullUrl(url),
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitials(initial, defaultText),
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Center(
              child: SizedBox(
                width: radius,
                height: radius,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(defaultText),
                ),
              ),
            );
          },
        );
      }
    } else {
      childContent = _buildInitials(initial, defaultText);
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: defaultBg,
        border: border,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: childContent,
      ),
    );
  }

  Widget _buildInitials(String initial, Color color) {
    return Center(
      child: Text(
        initial,
        style: TextStyle(
          fontSize: radius * 0.9,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
