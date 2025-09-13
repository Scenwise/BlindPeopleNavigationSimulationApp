export const speakCommand = (commandText: string) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(commandText);
        utterance.lang = 'en-US'; // You can change language if needed
        utterance.rate = 1;       // Speed (0.5 slow - 2 fast)
        utterance.pitch = 1;      // Pitch (0 low - 2 high)
        speechSynthesis.speak(utterance);
    } else {
        console.warn('Text-to-speech not supported in this browser.');
    }
}