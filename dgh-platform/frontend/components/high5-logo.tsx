"use client"

interface High5LogoProps {
    className?: string
    size?: "sm" | "md" | "lg" | "xl"
}

export function High5Logo({className = "", size = "md"}: High5LogoProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
    }

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Nurse figure with medical cap */}
                <g>
                    {/* Medical cap */}
                    <path
                        d="M60 40 C60 30, 80 25, 100 25 C120 25, 140 30, 140 40 L140 55 C140 60, 135 65, 130 65 L70 65 C65 65, 60 60, 60 55 Z"
                        fill="#4A90E2"
                    />
                    {/* Cross on cap */}
                    <rect x="95" y="35" width="10" height="20" fill="white"/>
                    <rect x="90" y="40" width="20" height="10" fill="white"/>

                    {/* Nurse head/body silhouette */}
                    <path
                        d="M70 65 C70 70, 75 75, 80 80 L80 120 C80 130, 85 140, 95 145 L105 145 C115 140, 120 130, 120 120 L120 80 C125 75, 130 70, 130 65"
                        fill="#7ED321"
                    />

                    {/* Arms/hands */}
                    <ellipse cx="65" cy="100" rx="15" ry="25" fill="#7ED321"/>
                    <ellipse cx="135" cy="100" rx="15" ry="25" fill="#7ED321"/>
                </g>

                {/* Dynamic curves */}
                <path
                    d="M30 120 Q50 100, 80 110 Q120 125, 170 105"
                    stroke="#4A90E2"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.7"
                />
                <path
                    d="M170 130 Q140 150, 100 140 Q60 125, 20 145"
                    stroke="#7ED321"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.7"
                />
            </svg>
        </div>
    )
}
