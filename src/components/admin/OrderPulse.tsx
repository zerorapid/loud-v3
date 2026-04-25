'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Phone, CheckCircle2, MessageSquare, Truck, Package, Zap, Clock, ChevronRight } from 'lucide-react';

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
    <div className="w-full">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3" />
      
      {/* TABLE HEADER */}
      <div className="flex items-center px-6 py-3 border-b-2 border-black text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-2">
        <div className="w-32 shrink-0">Order / Pulse</div>
        <div className="flex-1 px-8">Manifest / Items</div>
        <div className="flex-1 hidden xl:block px-8">Destination / Grid</div>
        <div className="w-32 shrink-0 text-center">Logistics</div>
        <div className="w-56 shrink-0 text-right">Control / Action</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white border border-black/5 flex h-24 relative group hover:border-black/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={`w-1.5 h-full shrink-0 ${
              order.status === 'Packing' ? 'bg-orange-500' : 
              order.status === 'Shipped' ? 'bg-blue-500' : 'bg-green-500'
            }`} />

            <div className="flex-1 flex items-center px-4 overflow-hidden">
              {/* PRIMARY DATA: ID & PRICE */}
              <div className="w-32 shrink-0 border-r border-black/5 pr-4 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[12px] font-black uppercase text-black/30 tracking-widest">#{order.id.toString().slice(-4)}</span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    order.status === 'Packing' ? 'bg-orange-500' : 
                    order.status === 'Shipped' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter leading-none">₹{order.total_amount}</h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-black/40 uppercase tracking-widest">
                  <Clock size={10} />
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* PAYLOAD GRID */}
              <div className="flex-1 min-w-0 px-8 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1.5">
                  <Package size={12} className="text-black/20" />
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                    order.status === 'Packing' ? 'bg-orange-50 text-orange-700' : 
                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-[15px] font-bold leading-tight line-clamp-2 text-black/80">
                  {order.items?.map((it: any) => `${it.quantity || 1}x ${it.name}`).join(', ')}
                </p>
              </div>

              {/* DESTINATION GRID */}
              <div className="flex-1 min-w-0 hidden xl:flex flex-col justify-center h-full border-l border-black/5 px-8">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin size={12} className="text-black/20" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Sector Grid</span>
                </div>
                <p className="text-[13px] font-bold leading-tight uppercase text-black/50 line-clamp-2">
                  {order.address?.flat}, {order.address?.area}
                </p>
              </div>

              {/* LOGISTICS STATUS */}
              <div className="w-32 shrink-0 flex flex-col items-center justify-center h-full border-l border-black/5">
                <div className="w-12 h-12 bg-uber-gray rounded-full flex items-center justify-center mb-1 group-hover:bg-black group-hover:text-white transition-all">
                  {order.transport_type === 'TRUCK' ? <Truck size={20} /> : <Zap size={20} />}
                </div>
                <span className="text-[10px] font-black uppercase text-black/30 tracking-widest">{order.total_weight_kg || '0.5'} KG</span>
              </div>

              {/* ACTION CONTROLS */}
              <div className="w-56 shrink-0 flex items-center justify-end gap-3 border-l border-black/5 pl-8 pr-4 h-full bg-uber-gray/10 group-hover:bg-white transition-all">
                <div className="flex gap-1">
                  <a href={`tel:${order.customer_phone}`} className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <Phone size={16} />
                  </a>
                  <a href={`https://wa.me/${order.customer_phone}`} target="_blank" className="w-10 h-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <MessageSquare size={16} />
                  </a>
                </div>
                
                <div className="flex-1">
                  {order.status === 'Packing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Shipped')}
                      className="w-full h-11 bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg active-scale"
                    >
                      <ChevronRight size={14} className="animate-pulse" />
                      Ship
                    </button>
                  )}
                  {order.status === 'Shipped' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Delivered')}
                      className="w-full h-11 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg active-scale"
                    >
                      <CheckCircle2 size={16} />
                      Drop
                    </button>
                  )}
                  {order.status === 'Delivered' && (
                    <div className="w-full h-11 border border-green-200 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <CheckCircle2 size={14} />
                      Done
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="py-24 border-2 border-dashed border-black/10 flex flex-col items-center justify-center text-[12px] font-semibold text-black/20 uppercase tracking-widest">
          Manifest Empty / No Pulses
        </div>
      )}
    </div>
  );
}
