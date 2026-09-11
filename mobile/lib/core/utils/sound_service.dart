import 'sound_service_stub.dart'
    if (dart.library.html) 'sound_service_web.dart' as impl;

class SoundService {
  /// Plays an audible synthesized chime or system ringtone preview based on selected tone name.
  static void playRingtone(String toneName) {
    impl.playSoundTone(toneName);
  }
}
