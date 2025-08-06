import {NextRequest, NextResponse} from "next/server"
import {translate} from "google-translate-api-browser"

export async function POST(req: NextRequest) {
    try {
        const {text} = await req.json()

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                {error: "Le paramètre 'text' est requis et doit être une chaîne de caractères."},
                {status: 400},
            )
        }

        // L'appel se fait côté serveur, donc pas de problème de CORS.
        const result = await translate(text, {to: "en"})

        return NextResponse.json({translatedText: result.text})
    } catch (error) {
        console.error("Erreur de l'API de traduction:", error)
        return NextResponse.json(
            {error: "La traduction a échoué sur le serveur."},
            {status: 500},
        )
    }
}