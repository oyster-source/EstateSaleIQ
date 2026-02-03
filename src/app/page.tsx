import { HoneycombButton } from "@/components/ui/HoneycombButton";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] p-8 pt-12 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-8 animate-float">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="block text-foreground mb-2">Maximize Your</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-500 via-gold-accent to-gold-secondary shadow-glow-lg">
            Estate Sales
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Instantly find market value for your items. Upload a photo, get real-time price comparisons from across the web.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
          <Link href="/scan">
            <HoneycombButton size="lg" className="w-full sm:w-auto text-xl shadow-glow">
              Start Scanning
            </HoneycombButton>
          </Link>
          <Link href="/demo">
            <HoneycombButton variant="outline" size="lg" className="w-full sm:w-auto text-xl">
              Watch Demo
            </HoneycombButton>
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
        {[
          { title: "Smart Recognition", desc: "Identify items instantly using advanced AI image analysis." },
          { title: "Market Data", desc: "Aggregates pricing from eBay, FB Marketplace, and more." },
          { title: "Maximize Profit", desc: "Get high/low estimates to set the perfect price." }
        ].map((feature, i) => (
          <div key={i} className="bg-honey-grid/50 border border-gold-800/20 p-6 rounded-2xl backdrop-blur-sm hover:border-gold-500/50 transition-colors">
            <h3 className="text-gold-400 font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
