import 'device_image_picker_stub.dart'
    if (dart.library.html) 'device_image_picker_web.dart' as impl;

class DeviceImagePicker {
  /// Opens device file manager / photo gallery and returns image as a Base64 Data URI string.
  static Future<String?> pickImage() async {
    return await impl.pickImageFromDevice();
  }
}
