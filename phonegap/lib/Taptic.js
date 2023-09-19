export default class Taptic {
  #isEnabled = false;

  async init() {
    if (import.meta.env.VITE_PLATFORM === 'ios') {
      this.#isEnabled = !!window.TapticEngine;
    }
    if (import.meta.env.VITE_PLATFORM === 'android') {
      this.#isEnabled = await new Promise((resolve) => {
        window.plugins.deviceFeedback.isFeedbackEnabled((feedback) => {
          resolve(feedback.haptic);
        });
      });
    }
  }

  tap() {
    if (!this.#isEnabled) return;
    if (import.meta.env.VITE_PLATFORM === 'ios') {
      window.TapticEngine.impact({
        style: 'light',
      });
    }
    if (import.meta.env.VITE_PLATFORM === 'android') {
      window.plugins.deviceFeedback.haptic(window.plugins.deviceFeedback.KEYBOARD_TAP);
    }
  }

  error() {
    if (!this.#isEnabled) return;
    if (import.meta.env.VITE_PLATFORM === 'ios') {
      window.TapticEngine.notification({
        type: 'error',
      });
    }
    if (import.meta.env.VITE_PLATFORM === 'android') {
      window.plugins.deviceFeedback.haptic(window.plugins.deviceFeedback.LONG_PRESS);
    }
  }
}
