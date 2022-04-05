let isEnabled;

async function init() {
  if (process.env.BUILD_TYPE !== 'phonegap') return;
  if (process.env.BUILD_PLATFORM === 'ios') {
    isEnabled = !!window.TapticEngine;
  } else if (process.env.BUILD_PLATFORM.startsWith('android')) {
    isEnabled = await new Promise((resolve) => {
      window.plugins.deviceFeedback.isFeedbackEnabled((feedback) => {
        resolve(feedback.haptic);
      });
    });
  }
}

function tap() {
  if (!isEnabled) return;
  if (process.env.BUILD_PLATFORM === 'ios') {
    window.TapticEngine.impact({
      style: 'light',
    });
  } else if (process.env.BUILD_PLATFORM.startsWith('android')) {
    window.plugins.deviceFeedback.haptic(window.plugins.deviceFeedback.KEYBOARD_TAP);
  }
}

function error() {
  if (!isEnabled) return;
  if (process.env.BUILD_PLATFORM === 'ios') {
    window.TapticEngine.notification({
      type: 'error',
    });
  } else if (process.env.BUILD_PLATFORM.startsWith('android')) {
    window.plugins.deviceFeedback.haptic(window.plugins.deviceFeedback.LONG_PRESS);
  }
}

export default {
  init,
  tap,
  error,
};
