import 'package:flutter/services.dart';

void playSoundTone(String toneName) {
  SystemSound.play(SystemSoundType.click);
  HapticFeedback.heavyImpact();
}
