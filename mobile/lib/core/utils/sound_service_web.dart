import 'package:flutter/services.dart';
// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

void playSoundTone(String toneName) {
  try {
    SystemSound.play(SystemSoundType.click);
    HapticFeedback.heavyImpact();
  } catch (_) {}

  try {
    // Escaped string for JS injection
    final sanitizedTone = toneName.replaceAll("'", "\\'");
    final jsCode = '''
      (function() {
        try {
          var AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          var ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          var tone = '$sanitizedTone';
          if (tone.indexOf('High Priority') !== -1) {
            [0, 0.12, 0.24].forEach(function(delay) {
              var osc = ctx.createOscillator();
              var gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
              gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + 0.1);
            });
          } else if (tone.indexOf('Soft Kitchen') !== -1) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } else if (tone.indexOf('Subtle Haptic') !== -1) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } else {
            var freqs = [523.25, 659.25, 783.99];
            freqs.forEach(function(freq, idx) {
              var delay = idx * 0.1;
              var osc = ctx.createOscillator();
              var gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + 0.3);
            });
          }
        } catch(e) {
          console.log('Audio synth error:', e);
        }
      })();
    ''';

    final script = html.ScriptElement()..text = jsCode;
    html.document.body?.append(script);
    // Cleanup script element after execution
    Future.delayed(const Duration(milliseconds: 1000), () {
      script.remove();
    });
  } catch (e) {
    // Fallback
  }
}
