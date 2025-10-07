/**
 * Text-to-Speech utilities for pronunciation
 */

export type TTSVoice = 'en-US' | 'en-GB';

/**
 * Play pronunciation using Web Speech API
 * @param text - Text to pronounce
 * @param voice - Voice type (en-US or en-GB)
 */
export function playPronunciation(text: string, voice: TTSVoice = 'en-US') {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice;
  utterance.rate = 0.9; // Slightly slower for learning
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to find a native voice for the selected language
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => v.lang.startsWith(voice));
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing speech
 */
export function stopPronunciation() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}
