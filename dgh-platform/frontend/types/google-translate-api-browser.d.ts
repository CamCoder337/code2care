// Fichier : types/google-translate-api-browser.d.ts

declare module 'google-translate-api-browser' {
    /**
     * Options for the translation function.
     */
    interface TranslateOptions {
        from?: string; // Language code (e.g., 'en', 'fr')
        to?: string;   // Language code
        raw?: boolean;
    }

    /**
     * The structure of the result returned by the translate function.
     */
    interface TranslateResult {
        text: string;
        from: {
            language: {
                didYouMean: boolean;
                iso: string;
            };
            text: {
                autoCorrected: boolean;
                value: string;
                didYouMean: boolean;
            };
        };
        raw: string;
    }

    /**
     * Translates a text string.
     * @param text The text to translate.
     * @param options Translation options.
     * @returns A promise that resolves with the translation result.
     */
    export function translate(
        text: string,
        options?: TranslateOptions
    ): Promise<TranslateResult>;
}