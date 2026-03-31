export class VoiceHandler {
    constructor(onResultCallback) {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            alert("Please use Google Chrome for speech recognition.");
            return;
        }
        this.recognition = new Recognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onresult = (event) => {
            let text = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            onResultCallback(text);
        };
        this.recognition.onerror = (e) => console.error("Mic Error:", e.error);
    }
    start() { this.recognition.start(); }
    stop() { this.recognition.stop(); }
}