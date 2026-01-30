import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { HoneycombButton } from '@/components/ui/HoneycombButton';

export default async function ItemsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, show empty state or redirect
    if (!user) {
        return (
            <main className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-foreground">No Items Yet</h1>
                <p className="text-gray-400 max-w-md">Start scanning items to see them appear here.</p>
                <Link href="/scan">
                    <HoneycombButton size="lg">Start Scanning</HoneycombButton>
                </Link>
            </main>
        );
    }

    // Fetch items
    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching items:", error);
        return <div className="p-10 text-center text-red-500">Error loading items</div>;
    }

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-gold-secondary">
                    Your Items
                </h1>
                <Link href="/scan">
                    <HoneycombButton>Scan New</HoneycombButton>
                </Link>
            </div>

            {items && items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <Link key={item.id} href={`/items/${item.id}`} className="group">
                            <div className="bg-honey-grid/20 border border-gold-800/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:border-gold-500/50 hover:shadow-glow hover:-translate-y-1 relative aspect-[4/5]">
                                <img
                                    src={item.image_url}
                                    alt="Item"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                    <div className="flex justify-between items-end">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${item.search_status === 'completed'
                                                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                : 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                                            }`}>
                                            {item.search_status?.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-honey-grid/10 rounded-3xl border border-gold-800/10">
                    <p className="text-xl text-gray-500 mb-6">You haven't scanned any items yet.</p>
                    <Link href="/scan">
                        <HoneycombButton variant="secondary">Start Your First Scan</HoneycombButton>
                    </Link>
                </div>
            )}
        </main>
    );
}
