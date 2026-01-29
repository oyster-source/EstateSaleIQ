import Link from 'next/link';

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-gold-800/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-gold-500 flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                        <span className="text-background font-bold text-lg">E</span>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-accent group-hover:text-gold-400 transition-colors">
                        EstateSaleIQ
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/items" className="text-sm font-medium text-gray-400 hover:text-gold-500 transition-colors">
                        My Items
                    </Link>
                    <Link href="/scan" className="text-sm font-medium text-gray-400 hover:text-gold-500 transition-colors">
                        Scan New
                    </Link>
                </nav>
            </div>
        </header>
    );
}
