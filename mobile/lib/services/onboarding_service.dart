import '../core/storage/storage_service.dart';

class OnboardingService {
  static Future<bool> isOnboardingCompleted() async {
    return await StorageService.isOnboardingCompleted();
  }

  static Future<void> markOnboardingCompleted() async {
    await StorageService.setOnboardingCompleted(true);
  }
}
