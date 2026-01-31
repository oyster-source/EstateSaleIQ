export function HexagonBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Large faint hexagon top right */}
            <div className="absolute top-[-10%] right-[-5%] opacity-5">
                <svg width="600" height="600" viewBox="0 0 100 100" className="fill-gold-500 animate-pulse-slow">
                    <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" />
                </svg>
            </div>

            {/* Medium hexagon bottom left */}
            <div className="absolute bottom-[-5%] left-[-5%] opacity-5">
                <svg width="400" height="400" viewBox="0 0 100 100" className="fill-gold-500">
                    <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" />
                </svg>
            </div>

            {/* Small floating hexagons */}
            <div className="absolute top-[20%] left-[10%] opacity-10">
                <svg width="50" height="50" viewBox="0 0 100 100" className="fill-none stroke-gold-400 stroke-2">
                    <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" />
                </svg>
            </div>

            <div className="absolute top-[40%] right-[15%] opacity-10">
                <svg width="80" height="80" viewBox="0 0 100 100" className="fill-none stroke-gold-400 stroke-2">
                    <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" />
                </svg>
            </div>

            <div className="absolute bottom-[30%] left-[20%] opacity-5">
                <svg width="120" height="120" viewBox="0 0 100 100" className="fill-gold-600/20">
                    <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" />
                </svg>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-honeycomb opacity-10 mix-blend-overlay"></div>
        </div>
    );
}
