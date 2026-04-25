'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, Tag, Wallet, Percent, Truck } from 'lucide-react';

export default function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    const [prodRes, orderRes] = await Promise.all([
      supabase.from('products').select('price, stock, sourcing_cost'),
      supabase.from('orders').select('*')
    ]);

    if (!prodRes.error && !orderRes.error) {
      // Stock Investment (Actual cost of capital)
      const totalStockInvestment = prodRes.data.reduce((acc, curr) => acc + ((curr.sourcing_cost || curr.price * 0.7) * curr.stock), 0);
      
      // Sales Breakdown
      let totalSales = 0;
      let totalDiscount = 0;
      let totalGST = 0;
      let totalFees = 0;
      let ordersWithCoupon = 0;
      let ordersWithoutCoupon = 0;

      orderRes.data.forEach(order => {
        totalSales += order.total_amount;
        totalDiscount += (order.coupon_discount || 0);
        totalGST += (order.gst_amount || 0);
        totalFees += (order.platform_fee || 0) + (order.handling_fee || 0) + (order.delivery_fee || 0) + (order.carry_bag_fee || 0);
        
        if (order.coupon) ordersWithCoupon++;
        else ordersWithoutCoupon++;
      });

      setData({
        stockInvestment: totalStockInvestment,
        sales: totalSales,
        discount: totalDiscount,
        gst: totalGST,
        fees: totalFees,
        ordersWithCoupon,
        ordersWithoutCoupon,
        totalOrders: orderRes.data.length
      });
    }
    setLoading(false);
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-caption animate-pulse">Calculating Financial Metrics...</div>;
  if (!data) return <div>Error loading analytics</div>;

  const MetricCard = ({ icon: Icon, label, value, subtext, color = "black" }: any) => (
    <div className="bg-white border-2 border-black/10 p-8 space-y-6 shadow-sm relative group overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 bg-uber-gray text-${color}`}>
          <Icon size={28} />
        </div>
        <div className="text-right">
          <p className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-1">{label}</p>
          <h2 className="text-[32px] font-black tracking-tighter leading-none">₹{value.toLocaleString()}</h2>
        </div>
      </div>
      {subtext && (
        <div className="flex items-center gap-2 border-t border-black/10 pt-4 relative z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
          <p className="text-[12px] font-bold text-black/70 uppercase tracking-widest">{subtext}</p>
        </div>
      )}
      <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none" aria-hidden="true">
        <Icon size={120} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <MetricCard 
          icon={Package} 
          label="STOCK INVESTMENT" 
          value={data.stockInvestment} 
          subtext="Value of all inventory in warehouse"
        />
        <MetricCard 
          icon={TrendingUp} 
          label="GROSS REVENUE" 
          value={data.sales} 
          subtext={`Total from ${data.totalOrders} verified orders`}
          color="green-600"
        />
        <MetricCard 
          icon={Wallet} 
          label="NET EARNINGS (EST.)" 
          value={data.sales - data.gst - data.fees} 
          subtext="Revenue excluding all GST & Fees"
          color="blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DISCOUNTS & OFFERS */}
        <div className="bg-white border-2 border-black/10 p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-4 border-b-2 border-black/5 pb-6">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
              <Tag size={20} />
            </div>
            <h3 className="text-[14px] font-black uppercase tracking-[0.2em]">Discount Intelligence</h3>
          </div>
          
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[40px] font-black tracking-tighter leading-none mb-1">₹{data.discount.toLocaleString()}</p>
                <p className="text-[12px] font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                   Total Discount Burned
                </p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-black tracking-tighter leading-none text-green-600">
                  {Math.round((data.ordersWithCoupon / data.totalOrders) * 100) || 0}%
                </p>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Conversion Rate</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-4 w-full bg-black/5 overflow-hidden flex border border-black/5">
                <div 
                  className="h-full bg-black transition-all duration-1000" 
                  style={{ width: `${(data.ordersWithCoupon / data.totalOrders) * 100}%` }} 
                  aria-label={`${data.ordersWithCoupon} orders with coupons`}
                />
                <div 
                  className="h-full bg-black/30 transition-all duration-1000 border-l border-white/20" 
                  style={{ width: `${(data.ordersWithoutCoupon / data.totalOrders) * 100}%` }} 
                  aria-label={`${data.ordersWithoutCoupon} orders without coupons`}
                />
              </div>
              <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-black" aria-hidden="true" />
                  <span className="text-black">With Coupons ({data.ordersWithCoupon})</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-black/30" aria-hidden="true" />
                  <span className="text-black/70">Regular Price ({data.ordersWithoutCoupon})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAXES & FEES */}
        <div className="bg-white border-2 border-black/10 p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-4 border-b-2 border-black/5 pb-6">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
              <Percent size={20} />
            </div>
            <h3 className="text-[14px] font-black uppercase tracking-[0.2em]">Fees & Taxes Matrix</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-black/5 border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-1 h-1 bg-black/40" />
                <span className="text-[12px] font-black text-black/70 uppercase tracking-widest">GST Collected (5%)</span>
              </div>
              <span className="text-[18px] font-black tracking-tighter">₹{data.gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-black/5 border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-1 h-1 bg-black/40" />
                <span className="text-[12px] font-black text-black/70 uppercase tracking-widest">Platform & Packaging Fees</span>
              </div>
              <span className="text-[18px] font-black tracking-tighter">₹{data.fees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-8">
              <span className="text-[14px] font-black uppercase tracking-[0.2em] text-black/40">Total Non-Inventory Income</span>
              <span className="text-[32px] font-black tracking-tighter leading-none">₹{(data.gst + data.fees).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
