
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://asvelariyhlcrnujtqsq.supabase.co";
const SUPABASE_KEY = "sb_publishable_T6-Wlk2PumuS8_xzBRI3ng_KWouOIDi";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runStressTest() {
    console.log("🚀 STARTING DECA-PULSE STRESS TEST...");
    
    // 1. Fetch live products to ensure valid orders
    const { data: products } = await supabase.from('products').select('*').limit(5);
    if (!products || products.length === 0) {
        console.error("❌ No products found. Test aborted.");
        return;
    }

    const testUsers = Array.from({ length: 10 }, (_, i) => ({
        phone: `99999000${i.toString().padStart(2, '0')}`,
        name: `Ghost User ${i + 1}`
    }));

    const locations = [
        { title: "Industrial Sector 7", area: "Warehouse District" },
        { title: "Residential Grid 4", area: "Metro Zone" },
        { title: "Office Complex 9", area: "Corporate Hub" }
    ];

    for (const user of testUsers) {
        console.log(`👤 Initializing Profile: ${user.phone}`);
        
        // Upsert Profile
        await supabase.from('profiles').upsert({
            phone: user.phone,
            name: user.name,
            last_active: new Date().toISOString()
        });

        // Place 2 orders per user
        for (let j = 0; j < 2; j++) {
            const loc = locations[Math.floor(Math.random() * locations.length)];
            const items = [
                { id: products[0].id, name: products[0].name, quantity: 1 + Math.floor(Math.random() * 3), price: products[0].price },
                { id: products[1].id, name: products[1].name, quantity: 1, price: products[1].price }
            ];
            const total = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);

            console.log(`🛒 ${user.name} placing order #${j+1} [₹${total}]`);
            
            const { data: order, error } = await supabase.from('orders').insert({
                customer_phone: user.phone,
                customer_name: user.name,
                total_amount: total,
                items: items,
                status: 'Packing',
                address: { title: loc.title, area: loc.area },
                transport_type: Math.random() > 0.5 ? 'TRUCK' : 'ZAP',
                total_weight_kg: Math.random() * 10
            }).select().single();

            if (error) console.error(`❌ Order Error:`, error);
            
            // Log Activity
            await supabase.from('user_activity').insert({
                customer_phone: user.phone,
                action: 'ORDER_PLACE',
                details: { order_id: order?.id, amount: total }
            });
        }
    }

    console.log("✅ DECA-PULSE COMPLETE. 20 ORDERS GENERATED.");
    console.log("👉 Check your Admin Dashboard now. It should be pulsing with 20 new entries.");
}

runStressTest();
