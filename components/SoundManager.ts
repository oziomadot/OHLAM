class SoundManager {
  static async playCoinSound() {
    try {
      // Play a pleasant coin collection sound
      await SoundManager.playBeep(1000, 300); // Higher pitch, longer duration for coins
      console.log('🪙 COIN SOUND!');
    } catch (error) {
      console.log('Could not play coin sound:', error);
    }
  }

  static async playSpinSound() {
    try {
      // Play a spinning/whooshing sound effect
      await SoundManager.playBeep(400, 150); // Lower pitch, shorter duration for spinning
      console.log('🎡 SPIN SOUND!');
    } catch (error) {
      console.log('Could not play spin sound:', error);
    }
  }

  // Generate a simple beep using Web Audio API (for web) or system sound (for mobile)
  static async playBeep(frequency = 800, duration = 200) {
    try {
      if (typeof window !== 'undefined' && window.AudioContext) {
        // Web platform
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      } else {
        // Mobile platform - could use vibration or other feedback
        console.log(`Beep: ${frequency}Hz for ${duration}ms`);
      }
    } catch (error) {
      console.log('Could not play beep:', error);
    }
  }
}

export default SoundManager;
