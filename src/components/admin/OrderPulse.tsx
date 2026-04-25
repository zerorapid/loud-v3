'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, MapPin, Phone, CheckCircle2, MessageSquare, Truck, Package, Clock, Zap } from 'lucide-react';

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
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow-xl overflow-hidden flex relative group border border-black/5">
            {/* Status Line */}
            <div className={`w-3 ${
              order.status === 'Packing' ? 'bg-orange-500' : 
              order.status === 'Shipped' ? 'bg-blue-500' : 'bg-green-500'
            }`} />

            <div className="flex-1 flex flex-col md:flex-row">
              <div className="flex-1 p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[28px] font-semibold tracking-tighter leading-none">₹{order.total_amount}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                        order.status === 'Packing' ? 'bg-orange-50 text-orange-700' : 
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-black/40 uppercase tracking-widest">
                      Order #{order.id.toString().slice(-4)} • {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a href={`tel:${order.customer_phone}`} className="w-12 h-12 bg-uber-gray flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <Phone size={18} />
                    </a>
                    <a href={`https://wa.me/${order.customer_phone}`} target="_blank" className="w-12 h-12 bg-uber-gray flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <MessageSquare size={18} />
                    </a>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 py-6 border-t border-black/5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Package size={18} className="text-black/20 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-1">Payload</p>
                        <p className="text-[13px] font-medium leading-relaxed">
                          {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-black/20 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-1">Destination</p>
                        <p className="text-[13px] font-medium leading-relaxed uppercase">
                          {order.address?.flat}, {order.address?.floor}, {order.address?.area}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-uber-gray/30 p-6 flex justify-between items-center rounded-none border border-black/5">
                  <div>
                    <p className="text-[10px] font-semibold text-black/40 uppercase tracking-widest mb-1">Logistics</p>
                    <div className="flex items-center gap-2">
                      {order.transport_type === 'TRUCK' ? <Truck size={16} /> : <Zap size={16} />}
                      <span className="text-[13px] font-semibold uppercase">{order.transport_type || 'BIKE'} ({order.total_weight_kg?.toFixed(1) || '0.5'}KG)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-black/40 uppercase tracking-widest mb-1">Payment</p>
                    <p className="text-[13px] font-semibold tracking-tight text-green-700">{order.utr || 'CASH'}</p>
                  </div>
                </div>

                <div className="pt-4">
                  {order.status === 'Packing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Shipped')}
                      className="w-full h-16 bg-black text-white text-[12px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black/90 transition-all active-scale"
                    >
                      <Truck size={20} />
                      Release for Shipment
                    </button>
                  )}
                  {order.status === 'Shipped' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Delivered')}
                      className="w-full h-16 bg-green-600 text-white text-[12px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-green-700 transition-all active-scale"
                    >
                      <CheckCircle2 size={20} />
                      Confirm Dropoff
                    </button>
                  )}
                  {order.status === 'Delivered' && (
                    <div className="w-full h-16 bg-green-50 text-green-700 text-[11px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      Transaction Finalized
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="py-24 border-2 border-dashed border-black/10 flex flex-col items-center justify-center text-[12px] font-semibold text-black/20 uppercase tracking-widest">
            No active pulses found
          </div>
        )}
      </div>
    </div>
  );
}
