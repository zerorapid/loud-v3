'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, MapPin, Phone, CheckCircle2, MessageSquare, Truck, Package, Clock } from 'lucide-react';

export default function OrderPulse() {
  const [orders, setOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new, ...prev]);
        if (audioRef.current) audioRef.current.play().catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setOrders(data);
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    }
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3" />
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow-sm overflow-hidden flex flex-col md:flex-row relative">
            {/* Status Line - Tactic 47 */}
            <div className={`w-2 md:w-4 ${
              order.status === 'Packing' ? 'bg-orange-500' : 
              order.status === 'Shipped' ? 'bg-blue-500' : 'bg-green-500'
            }`} />

            <div className="flex-1 p-6 space-y-6">
              {/* HEADER: AMOUNT & TIME */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[32px] font-black tracking-tighter leading-none">₹{order.total_amount}</h3>
                    <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'Packing' ? 'bg-orange-50 text-orange-700' : 
                      order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-black/30 uppercase tracking-widest">
                    Order #{order.id.toString().slice(-4)} • {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <a href={`tel:${order.customer_phone}`} className="w-10 h-10 bg-uber-gray flex items-center justify-center hover:bg-black hover:text-white transition-all active-scale">
                      <Phone size={18} />
                    </a>
                    <a href={`https://wa.me/${order.customer_phone}`} target="_blank" className="w-10 h-10 bg-uber-gray flex items-center justify-center hover:bg-black hover:text-white transition-all active-scale">
                      <MessageSquare size={18} />
                    </a>
                  </div>
                  <div className="text-[10px] font-black text-black/20 uppercase tracking-tighter">
                    {order.customer_phone}
                  </p>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Package size={20} className="text-black/10 mt-1" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-black/40 mb-1">Items</p>
                      <p className="text-[14px] font-bold leading-tight">
                        {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-black/10 mt-1" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-black/40 mb-1">Destination</p>
                      <p className="text-[14px] font-bold leading-tight uppercase">
                        {order.address?.flat}, {order.address?.floor}, {order.address?.area}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-uber-gray/40 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Logistics</p>
                      <div className="flex items-center gap-2">
                        {order.transport_type === 'TRUCK' ? <Truck size={18} /> : <div className="material-symbols-outlined text-[18px]">electric_scooter</div>}
                        <span className="text-[14px] font-black uppercase">{order.transport_type || 'BIKE'} ({order.total_weight_kg?.toFixed(1) || '0.5'}KG)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">UTR/Payment</p>
                      <p className="text-[14px] font-black tracking-tighter text-green-700">{order.utr || 'CASH'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2">
                {order.status === 'Packing' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Shipped')}
                    className="w-full bg-black text-white h-16 text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 active-scale shadow-xl"
                  >
                    <Truck size={24} />
                    Ship to {order.address?.area}
                  </button>
                )}
                {order.status === 'Shipped' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Delivered')}
                    className="w-full bg-green-600 text-white h-16 text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 active-scale shadow-xl"
                  >
                    <CheckCircle2 size={24} />
                    Confirm Dropoff
                  </button>
                )}
                {order.status === 'Delivered' && (
                  <div className="w-full h-16 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    Order Finalized
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="py-20 border-2 border-dashed border-uber-gray flex flex-col items-center justify-center text-caption text-black/10">
            No live orders yet
          </div>
        )}
      </div>
    </div>
  );
}
