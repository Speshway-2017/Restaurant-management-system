import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flavora_waiter_mobile/services/onboarding_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('Initial onboarding state should be false', () async {
    final completed = await OnboardingService.isOnboardingCompleted();
    expect(completed, isFalse);
  });

  test('Marking onboarding completed should persist true in SharedPreferences', () async {
    await OnboardingService.markOnboardingCompleted();
    final completed = await OnboardingService.isOnboardingCompleted();
    expect(completed, isTrue);
  });
}
