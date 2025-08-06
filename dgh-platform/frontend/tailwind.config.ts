import type {Config} from "tailwindcss"

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
        "*.{js,ts,jsx,tsx,mdx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "#4F46E5",
                    50: "#EEF2FF",
                    100: "#E0E7FF",
                    500: "#4F46E5",
                    600: "#4338CA",
                    700: "#3730A3",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "#10B981",
                    50: "#ECFDF5",
                    100: "#D1FAE5",
                    500: "#10B981",
                    600: "#059669",
                    700: "#047857",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                accent: {
                    DEFAULT: "#06B6D4",
                    50: "#ECFEFF",
                    100: "#CFFAFE",
                    500: "#06B6D4",
                    600: "#0891B2",
                    700: "#0E7490",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            screens: {
                // Téléphones
                xs: "375px", // iPhone SE, petits téléphones
                sm: "640px", // Téléphones standards
                // Tablettes
                md: "768px", // Tablettes portrait
                lg: "1024px", // Tablettes paysage, petits laptops
                // PC/Desktop
                xl: "1280px", // Desktop standard
                "2xl": "1536px", // Grands écrans desktop
                // TV/Très grands écrans
                "3xl": "1920px", // Full HD
                "4xl": "2560px", // 2K/4K
                "5xl": "3840px", // 4K Ultra Wide
            },
            keyframes: {
                "accordion-down": {
                    from: {height: "0"},
                    to: {height: "var(--radix-accordion-content-height)"},
                },
                "accordion-up": {
                    from: {height: "var(--radix-accordion-content-height)"},
                    to: {height: "0"},
                },
                "fade-in": {
                    "0%": {opacity: "0", transform: "translateY(10px)"},
                    "100%": {opacity: "1", transform: "translateY(0)"},
                },
                "slide-in": {
                    "0%": {transform: "translateX(-100%)"},
                    "100%": {transform: "translateX(0)"},
                },
                "scale-in": {
                    "0%": {transform: "scale(0.95)", opacity: "0"},
                    "100%": {transform: "scale(1)", opacity: "1"},
                },
                "pulse-glow": {
                    "0%, 100%": {boxShadow: "0 0 0 0 rgba(79, 70, 229, 0.4)"},
                    "50%": {boxShadow: "0 0 0 10px rgba(79, 70, 229, 0)"},
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.5s ease-out",
                "slide-in": "slide-in 0.3s ease-out",
                "scale-in": "scale-in 0.2s ease-out",
                "pulse-glow": "pulse-glow 2s infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
