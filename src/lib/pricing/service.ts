export interface PriceFinding {
    source: string;
    price: number;
    currency: string;
    url: string;
    title: string;
    image_url: string;
}

export interface PricingResult {
    low: number;
    high: number;
    average: number;
    findings: PriceFinding[];
}

export async function findItemPrices(imageUrl: string): Promise<PricingResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data generation based on random variance
    const basePrice = Math.floor(Math.random() * 200) + 50;

    const findings: PriceFinding[] = [
        {
            source: 'eBay',
            price: basePrice,
            currency: 'USD',
            url: 'https://ebay.com',
            title: 'Vintage Gold Honeycomb Item',
            image_url: imageUrl
        },
        {
            source: 'Facebook Marketplace',
            price: Math.floor(basePrice * 0.8),
            currency: 'USD',
            url: 'https://facebook.com',
            title: 'Used Item - Good Condition',
            image_url: imageUrl
        },
        {
            source: 'Etsy',
            price: Math.floor(basePrice * 1.4),
            currency: 'USD',
            url: 'https://etsy.com',
            title: 'Rare Collectible Item',
            image_url: imageUrl
        },
        {
            source: 'Chairish',
            price: Math.floor(basePrice * 1.8),
            currency: 'USD',
            url: 'https://chairish.com',
            title: 'Antique Item',
            image_url: imageUrl
        }
    ];

    const prices = findings.map(f => f.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    return {
        low,
        high,
        average,
        findings
    };
}
