import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const Coupons = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: '',
    minAmount: '',
    expiresAt: '',
    usageLimit: '',
    allowedPlans: []
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/coupons`, { headers: { aToken } });
      if (data.success) setList(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        allowedPlans: form.allowedPlans
      };
      const { data } = await axios.post(`${backendUrl}/api/coupons`, payload, { headers: { aToken } });
      if (data.success) {
        setForm({
          code: '',
          discountType: 'percent',
          discountValue: 10,
          maxDiscount: '',
          minAmount: '',
          expiresAt: '',
          usageLimit: '',
          allowedPlans: []
        });
        fetchCoupons();
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await axios.post(`${backendUrl}/api/coupons/${id}/toggle`, {}, { headers: { aToken } });
      fetchCoupons();
    } catch {}
  };

  const handleAllowedPlan = (plan) => {
    setForm((prev) => {
      const exists = prev.allowedPlans.includes(plan);
      return { ...prev, allowedPlans: exists ? prev.allowedPlans.filter(p => p !== plan) : [...prev.allowedPlans, plan] };
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <p className="text-gray-500 text-sm">Create and manage verification coupons</p>
        </div>
        <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Back</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Create Coupon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="e.g. VERIFY20" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md">
                <option value="percent">Percent</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Discount Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Max Discount</label>
              <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Min Amount</label>
              <input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Expires At</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Allowed Plans</label>
              <div className="mt-2 flex gap-3">
                {['Monthly', 'Quarterly', 'Yearly'].map((p) => (
                  <label key={p} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.allowedPlans.includes(p)} onChange={() => handleAllowedPlan(p)} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Coupons List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Code</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Value</th>
                  <th className="py-2">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b">
                    <td className="py-2 font-medium">{c.code}</td>
                    <td className="py-2">{c.discountType}</td>
                    <td className="py-2">{c.discountValue}</td>
                    <td className="py-2">{c.active ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                      <button onClick={() => toggleActive(c._id)} className="px-3 py-1 rounded-md border hover:bg-gray-50">
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coupons;
