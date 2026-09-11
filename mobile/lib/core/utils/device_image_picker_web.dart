import 'dart:async';
// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

Future<String?> pickImageFromDevice() async {
  final Completer<String?> completer = Completer<String?>();
  final html.FileUploadInputElement input = html.FileUploadInputElement();
  input.accept = 'image/*';
  input.click();

  input.onChange.listen((e) {
    final files = input.files;
    if (files != null && files.isNotEmpty) {
      final file = files[0];
      final reader = html.FileReader();
      reader.readAsDataUrl(file);
      reader.onLoadEnd.listen((e) {
        final result = reader.result?.toString();
        completer.complete(result);
      });
      reader.onError.listen((_) {
        completer.complete(null);
      });
    } else {
      completer.complete(null);
    }
  });

  return completer.future;
}
