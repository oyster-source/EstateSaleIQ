'use server';

import { createClient } from '@/lib/supabase/client'; // This might need a server-safe client if using cookies, but for anon it's ok-ish or use createServerClient
import { findItemPrices } from '@/lib/pricing/service';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get server client
async function getSupabase() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Server Actions can set cookies
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    );
}


export async function analyzeItemPricing(itemId: string) {
    const supabase = await getSupabase();

    // 1. Fetch item
    const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

    if (error || !item) {
        throw new Error('Item not found');
    }

    // 2. Perform search (Mock)
    const result = await findItemPrices(item.image_url);

    // 3. Save findings
    const findingsPayload = result.findings.map(f => ({
        item_id: itemId,
        source: f.source,
        price: f.price,
        currency: f.currency,
        url: f.url,
        title: f.title,
        image_url: f.image_url
    }));

    const { error: insertError } = await supabase
        .from('price_findings')
        .insert(findingsPayload);

    if (insertError) {
        console.error('Failed to save findings:', insertError);
        throw insertError;
    }

    // 4. Update item status
    await supabase
        .from('items')
        .update({ search_status: 'completed' })
        .eq('id', itemId);

    return result;
}
