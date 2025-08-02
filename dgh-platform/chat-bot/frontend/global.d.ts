// global.d.ts

declare var SpeechRecognition: any

interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
}
