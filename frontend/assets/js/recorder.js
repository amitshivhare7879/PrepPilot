class VoiceRecorder {
    constructor(onResultCallback) {
        this.onResultCallback = onResultCallback;
        this.recognition = null;
        this.isStarted = false;
        this.finalTranscript = '';
        
        // Browser Support Check
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported in this browser.');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            this.onResultCallback(this.finalTranscript + interimTranscript);
        };

        this.recognition.onstart = () => {
            this.isStarted = true;
            console.log('STT Engine: Active');
        };

        this.recognition.onend = () => {
            this.isStarted = false;
            console.log('STT Engine: Offline');
        };
    }

    start() {
        if (this.recognition && !this.isStarted) {
            this.finalTranscript = '';
            this.recognition.start();
        }
    }

    stop() {
        if (this.recognition && this.isStarted) {
            this.recognition.stop();
        }
    }

    reset() {
        this.finalTranscript = '';
    }
}

export default VoiceRecorder;