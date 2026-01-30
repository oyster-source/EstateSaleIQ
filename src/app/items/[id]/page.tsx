import { createClient } from '@/lib/supabase/client'; // This is client side, we need server side fetching or client side? 
// Page components in App Router are server components by default.
// We can fetch data directly here.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { analyzeItemPricing } from '@/app/actions/analyze';
import { HoneycombButton } from '@/components/ui/HoneycombButton';
import Link from 'next/link';

export default async function ItemPage({ params }: { params: { id: string } }) {
    // Await params first (Next.js 15 requirement, good practice generally now)
    const { id } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
            },
        }
    );

    const { data: item } = await supabase.from('items').select('*').eq('id', id).single();

    if (!item) {
        return <div className="p-10 text-center text-red-500">Item not found</div>;
    }

    // If pending, trigger analysis
    let findings = [];
    if (item.search_status === 'pending') {
        try {
            const result = await analyzeItemPricing(id);
            findings = result.findings;
        } catch (e) {
            console.error("Analysis failed", e);
        }
    } else {
        // Fetch existing findings
        const { data } = await supabase.from('price_findings').select('*').eq('item_id', id);
        findings = data || [];
    }

    // Calculate stats
    const prices = findings.map((f: any) => Number(f.price));
    const low = prices.length ? Math.min(...prices) : 0;
    const high = prices.length ? Math.max(...prices) : 0;
    const average = prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0;


    return (
        <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">

            {/* Top Section: Image & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left: Image */}
                <div className="rounded-3xl overflow-hidden border-2 border-gold-800/30 shadow-glow relative group bg-black/40 flex items-center justify-center h-96">
                    <img src={item.image_url} alt="Uploaded Item" className="w-full h-full object-contain" />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-gold-500/30">
                        <span className="text-gold-400 font-mono text-sm uppercase tracking-wider">{item.search_status}</span>
                    </div>
                </div>

                {/* Right: Pricing Stats */}
                <div className="space-y-6 animate-slide-up">
                    <div className="bg-honey-grid/10 border border-gold-800/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <h2 className="text-2xl font-bold text-foreground mb-6">Valuation Estimate</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-xl border border-gold-500/20 text-center">
                                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Lowest</p>
                                <p className="text-3xl font-bold text-red-400">${low}</p>
                            </div>
                            <div className="p-4 bg-black/40 rounded-xl border border-gold-500/20 text-center">
                                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Highest</p>
                                <p className="text-3xl font-bold text-green-400">${high}</p>
                            </div>
                            <div className="col-span-2 p-4 bg-gold-500/10 rounded-xl border border-gold-500/40 text-center shadow-glow">
                                <p className="text-gold-400 text-sm uppercase tracking-wider mb-1">Recommended Price</p>
                                <p className="text-5xl font-bold text-gold-500">${average}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/scan" className="flex-1">
                            <HoneycombButton variant="secondary" className="w-full">Scan Another</HoneycombButton>
                        </Link>
                        <HoneycombButton className="flex-1">List Item (Coming Soon)</HoneycombButton>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Sources */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gold-400 pl-2 border-l-4 border-gold-500">Comparable Listings Found</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {findings.map((finding: any) => (
                        <a key={finding.id} href={finding.url} target="_blank" rel="noreferrer" className="block group">
                            <div className="bg-honey-grid/20 border border-gold-800/20 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-gold-500 hover:bg-honey-grid/40 hover:transform hover:-translate-y-1">
                                <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden flex-shrink-0">
                                    {finding.image_url ? (
                                        <img src={finding.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gold-800">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground truncate">{finding.title || finding.source}</h4>
                                    <p className="text-sm text-gold-500/80">{finding.source}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl text-foreground">${finding.price}</p>
                                    <span className="text-xs text-gray-500">View &rarr;</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

        </main>
    );
}
