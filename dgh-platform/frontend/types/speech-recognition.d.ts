// Fichier : types/speech-recognition.d.ts

// Ce fichier apprend à TypeScript ce qu'est l'API Web Speech.

interface SpeechGrammar {
    src: string;
    weight: number;
}

interface SpeechGrammarList {
    readonly length: number;

    item(index: number): SpeechGrammar;

    [index: number]: SpeechGrammar;

    addFromURI(src: string, weight?: number): void;

    addFromString(string: string, weight?: number): void;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error:
        | "no-speech"
        | "aborted"
        | "audio-capture"
        | "network"
        | "not-allowed"
        | "service-not-allowed"
        | "bad-grammar"
        | "language-not-supported";
    readonly message: string;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;

    item(index: number): SpeechRecognitionAlternative;

    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;

    item(index: number): SpeechRecognitionResult;

    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    // --- Correction ici ---
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null; // Ajout de la propriété manquante
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;

    start(): void;

    stop(): void;

    abort(): void;
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
}