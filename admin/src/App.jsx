import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { LayoutDashboard, ShoppingCart, Tag, Store, Users, Power, Edit, Save } from 'lucide-react';

const AdminDashboard = () => {
  const { brands, products, orders, toggleBrandStatus, updateOrderStatus, updateProductRolePrices } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrices, setEditPrices] = useState({ salonPrice: 0, artistPrice: 0, beauticianPrice: 0 });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.totalAmount : sum), 0);
  const activeBrands = brands.filter(b => b.enabled).length;

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setEditPrices({
      salonPrice: product.salonPrice,
      artistPrice: product.artistPrice,
      beauticianPrice: product.beauticianPrice,
    });
  };

  const handleSavePrices = (productId) => {
    updateProductRolePrices(productId, editPrices);
    setEditingProductId(null);
  };

  return (
    <div className="min-h-screen bg-salbeau-bg text-[#2C1D16] flex flex-col md:flex-row font-sans">
      {/* Sidebar - Tailwind CSS Styled */}
      <aside className="w-full md:w-64 bg-salbeau-brown text-white p-5 flex flex-col justify-between shadow-xl flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-salbeau-brownMuted/40">
            <div className="w-10 h-10 rounded-xl bg-salbeau-surface text-salbeau-brown flex items-center justify-center font-bold text-xl shadow-inner">
              S
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white">Salbeau Admin</h1>
              <span className="text-[10px] text-salbeau-surface/80 uppercase tracking-widest">Tailwind Web Console</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-salbeau-surface text-salbeau-brown shadow-sm'
                  : 'text-salbeau-surface/80 hover:bg-salbeau-brownMuted/30 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} /> Executive Dashboard
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                activeTab === 'orders'
                  ? 'bg-salbeau-surface text-salbeau-brown shadow-sm'
                  : 'text-salbeau-surface/80 hover:bg-salbeau-brownMuted/30 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3"><ShoppingCart size={18} /> Store Orders</span>
              <span className="bg-salbeau-brownMuted text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('brands')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                activeTab === 'brands'
                  ? 'bg-salbeau-surface text-salbeau-brown shadow-sm'
                  : 'text-salbeau-surface/80 hover:bg-salbeau-brownMuted/30 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3"><Store size={18} /> Brand Visibility</span>
              <span className="text-[10px] text-salbeau-surface">{activeBrands}/{brands.length} Active</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors ${
                activeTab === 'products'
                  ? 'bg-salbeau-surface text-salbeau-brown shadow-sm'
                  : 'text-salbeau-surface/80 hover:bg-salbeau-brownMuted/30 hover:text-white'
              }`}
            >
              <Tag size={18} /> Role Pricing Matrix
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-salbeau-brownMuted/40 text-[11px] text-salbeau-surface/70">
          Salbeau Admin • Styled with Tailwind CSS v3
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-salbeau-border">
          <div>
            <h2 className="text-xl font-bold text-salbeau-brown uppercase tracking-wide">{activeTab}</h2>
            <p className="text-xs text-salbeau-brownMuted">Administer store orders, partner brands, and dynamic role prices.</p>
          </div>
          <span className="text-xs font-bold text-salbeau-brown bg-salbeau-surface px-3 py-1 rounded-full border border-salbeau-border">
            Tailwind CSS UI
          </span>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-salbeau-border shadow-sm">
                <div className="text-xs font-bold text-salbeau-brownMuted uppercase mb-1">Total Store Orders</div>
                <div className="text-2xl font-bold text-salbeau-brown">{totalOrders}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">Live customer feed</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-salbeau-border shadow-sm">
                <div className="text-xs font-bold text-salbeau-brownMuted uppercase mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-salbeau-brown">₹{totalRevenue}</div>
                <div className="text-[10px] text-salbeau-brownMuted mt-1">No gateway fee</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-salbeau-border shadow-sm">
                <div className="text-xs font-bold text-salbeau-brownMuted uppercase mb-1">Active Brands</div>
                <div className="text-2xl font-bold text-salbeau-brown">{activeBrands} / {brands.length}</div>
                <div className="text-[10px] text-salbeau-brownMuted mt-1">Query-level filter active</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-salbeau-border shadow-sm">
              <h3 className="font-bold text-sm text-salbeau-brown uppercase mb-3">Live Orders Queue</h3>
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id} className="p-3.5 bg-salbeau-bg rounded-xl border border-salbeau-border flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-salbeau-brown">{o.id}</strong> — {o.userName} ({o.userRole.toUpperCase()})
                      <div className="text-[11px] text-salbeau-brownMuted mt-0.5">{o.branch} • Amount: ₹{o.totalAmount}</div>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-salbeau-border text-salbeau-brown outline-none"
                    >
                      <option value="placed">Placed</option>
                      <option value="preparing">Preparing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-salbeau-border shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-salbeau-surface text-salbeau-brown uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer & Role</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-salbeau-border">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-salbeau-bg">
                    <td className="p-3 font-bold text-salbeau-brown">{o.id}</td>
                    <td className="p-3">{o.userName} ({o.userRole})</td>
                    <td className="p-3 text-salbeau-brownMuted">{o.branch}</td>
                    <td className="p-3 font-bold text-salbeau-brown">₹{o.totalAmount}</td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="px-2 py-1 rounded font-bold border border-salbeau-border bg-white text-salbeau-brown outline-none"
                      >
                        <option value="placed">Placed</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {brands.map(brand => (
              <div key={brand.id} className="p-4 bg-white rounded-2xl border border-salbeau-border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{brand.logo}</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#2C1D16]">{brand.name}</h4>
                    <span className="text-[10px] text-salbeau-brownMuted">{brand.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleBrandStatus(brand.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    brand.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Power size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-salbeau-border shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-salbeau-surface text-salbeau-brown uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">MRP</th>
                  <th className="p-3">Salon Price</th>
                  <th className="p-3">Artist Price</th>
                  <th className="p-3">Beautician Price</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-salbeau-border">
                {products.map(p => {
                  const isEditing = editingProductId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-salbeau-bg">
                      <td className="p-3 font-bold text-[#2C1D16]">{p.name}</td>
                      <td className="p-3">₹{p.mrp}</td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrices.salonPrice}
                            onChange={(e) => setEditPrices({ ...editPrices, salonPrice: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-salbeau-brown rounded font-bold"
                          />
                        ) : (
                          <span className="font-bold text-salbeau-brown">₹{p.salonPrice}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrices.artistPrice}
                            onChange={(e) => setEditPrices({ ...editPrices, artistPrice: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-salbeau-brown rounded font-bold"
                          />
                        ) : (
                          <span className="font-bold text-salbeau-brown">₹{p.artistPrice}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrices.beauticianPrice}
                            onChange={(e) => setEditPrices({ ...editPrices, beauticianPrice: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-salbeau-brown rounded font-bold"
                          />
                        ) : (
                          <span className="font-bold text-salbeau-brown">₹{p.beauticianPrice}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <button onClick={() => handleSavePrices(p.id)} className="bg-salbeau-brown text-white px-3 py-1 rounded font-bold flex items-center gap-1">
                            <Save size={12} /> Save
                          </button>
                        ) : (
                          <button onClick={() => handleStartEdit(p)} className="bg-salbeau-surface text-salbeau-brown px-2.5 py-1 rounded font-semibold flex items-center gap-1 border border-salbeau-border hover:bg-salbeau-brown hover:text-white">
                            <Edit size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
