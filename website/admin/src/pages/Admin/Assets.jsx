import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Package, Plus, Search, Trash2, Download, X } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const pad2 = (n) => String(n).padStart(2, '0');
const todayCode = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  return `${yy}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
};

const prefixFromName = (name) => {
  if (!name) return 'XX';
  const letters = name.replace(/\s+/g, '').toUpperCase();
  return letters.slice(0, 2) || 'XX';
};

const nextSuffixStart = (inventory, dateCode, prefix) => {
  let max = 0;
  for (const item of inventory) {
    if (item.assetId.startsWith(`${dateCode}${prefix}`)) {
      const num = item.assetId.slice((dateCode + prefix).length);
      const parsed = parseInt(num, 10);
      if (!isNaN(parsed) && parsed > max) max = parsed;
    }
  }
  return max + 1;
};

const Assets = () => {
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [inventory, setInventory] = useState([]);
  const [useLocal, setUseLocal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: 1,
    location: '',
    notes: ''
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/admin/assets`, {
          headers: { aToken }
        });
        if (res.data && Array.isArray(res.data.data)) {
          setInventory(res.data.data);
          setUseLocal(false);
        } else {
          setUseLocal(true);
          const raw = localStorage.getItem('admin_assets_inventory');
          setInventory(raw ? JSON.parse(raw) : []);
        }
      } catch {
        setUseLocal(true);
        const raw = localStorage.getItem('admin_assets_inventory');
        setInventory(raw ? JSON.parse(raw) : []);
      }
    };
    init();
  }, [aToken, backendUrl]);
  
  useEffect(() => {
    if (useLocal) {
      try {
        localStorage.setItem('admin_assets_inventory', JSON.stringify(inventory));
      } catch {}
    }
  }, [inventory, useLocal]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return inventory;
    return inventory.filter((i) =>
      i.assetId.toLowerCase().includes(s) ||
      i.name.toLowerCase().includes(s) ||
      (i.category || '').toLowerCase().includes(s) ||
      (i.location || '').toLowerCase().includes(s)
    );
  }, [search, inventory]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const qty = Math.max(1, Math.floor(form.quantity || 1));
    if (!form.name.trim()) {
      toast.error('Enter asset name');
      return;
    }
    const dateCode = todayCode();
    const prefix = prefixFromName(form.name);
    const start = nextSuffixStart(inventory, dateCode, prefix);
    const width = Math.max(2, String(start + qty - 1).length);
    const newItems = [];
    for (let i = 0; i < qty; i++) {
      const suffix = String(start + i).padStart(width, '0');
      newItems.push({
        assetId: `${dateCode}${prefix}${suffix}`,
        name: form.name.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        notes: form.notes.trim(),
        createdAt: new Date().toISOString()
      });
    }
    const save = async () => {
      if (!useLocal) {
        try {
          try {
            const res = await axios.post(`${backendUrl}/api/admin/assets/bulk`, { items: newItems }, { headers: { aToken } });
            if (res.data && Array.isArray(res.data.data)) {
              setInventory((prev) => [...res.data.data, ...prev]);
            } else {
              throw new Error('Bulk unsupported');
            }
          } catch {
            for (const item of newItems) {
              await axios.post(`${backendUrl}/api/admin/assets`, item, { headers: { aToken } });
            }
            const list = await axios.get(`${backendUrl}/api/admin/assets`, { headers: { aToken } });
            setInventory(Array.isArray(list.data.data) ? list.data.data : []);
          }
          toast.success(`Created ${newItems.length} item${newItems.length > 1 ? 's' : ''}`);
          setForm((f) => ({ ...f, quantity: 1 }));
          return;
        } catch {
          setUseLocal(true);
        }
      }
      setInventory((prev) => [...newItems, ...prev]);
      toast.success(`Created ${newItems.length} item${newItems.length > 1 ? 's' : ''}`);
      setForm((f) => ({ ...f, quantity: 1 }));
    };
    save();
  };

  const removeItem = (id) => {
    const run = async () => {
      if (!useLocal) {
        try {
          await axios.delete(`${backendUrl}/api/admin/assets/${encodeURIComponent(id)}`, { headers: { aToken } });
          const list = await axios.get(`${backendUrl}/api/admin/assets`, { headers: { aToken } });
          setInventory(Array.isArray(list.data.data) ? list.data.data : []);
          toast.success('Removed');
          return;
        } catch {
          setUseLocal(true);
        }
      }
      setInventory((prev) => prev.filter((i) => i.assetId !== id));
      toast.success('Removed');
    };
    run();
  };

  const clearAll = () => {
    const run = async () => {
      if (!useLocal) {
        try {
          await axios.delete(`${backendUrl}/api/admin/assets`, { headers: { aToken } });
          setInventory([]);
          toast.success('Cleared');
          return;
        } catch {
          setUseLocal(true);
        }
      }
      setInventory([]);
      try {
        localStorage.removeItem('admin_assets_inventory');
      } catch {}
      toast.success('Cleared');
    };
    run();
  };

  const exportExcel = () => {
    const rows = filtered.map((i) => ({
      AssetID: i.assetId,
      Name: i.name,
      Category: i.category || '',
      Location: i.location || '',
      Created: i.createdAt ? new Date(i.createdAt).toLocaleString() : ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    XLSX.writeFile(wb, `assets_${todayCode()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const head = [['Asset ID', 'Name', 'Category', 'Location', 'Created']];
    const body = filtered.map((i) => [
      i.assetId,
      i.name,
      i.category || '',
      i.location || '',
      i.createdAt ? new Date(i.createdAt).toLocaleString() : ''
    ]);
    autoTable(doc, {
      head,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] },
      startY: 15,
      margin: { left: 10, right: 10 }
    });
    doc.save(`assets_${todayCode()}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Assets</h2>
              <p className="text-xs text-gray-500">Create and track hospital items inventory</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-12 gap-3 mb-5 items-end">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Item name (e.g., Chair)"
            className="md:col-span-4 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            name="category"
            value={form.category}
            onChange={onChange}
            placeholder="Category"
            className="md:col-span-3 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            min="1"
            name="quantity"
            value={form.quantity}
            onChange={onChange}
            placeholder="Qty"
            className="md:col-span-2 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="Location"
            className="md:col-span-3 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Notes (optional)"
            className="md:col-span-10 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <div className="md:col-span-2 flex md:justify-end">
            <button type="submit" className="w-full md:w-auto px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </form>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, category, location"
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="relative flex items-center gap-2 md:justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportExcel();
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportPDF();
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    PDF (.pdf)
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="px-3 py-2 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-2">Asset ID</th>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">Location</th>
                <th className="py-2 pr-2">Created</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No assets found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.assetId} className="border-b">
                    <td className="py-2 pr-2 font-mono">{item.assetId}</td>
                    <td className="py-2 pr-2">{item.name}</td>
                    <td className="py-2 pr-2">{item.category}</td>
                    <td className="py-2 pr-2">{item.location}</td>
                    <td className="py-2 pr-2">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-2">
                      <button
                        onClick={() => setConfirmDeleteId(item.assetId)}
                        className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-red-600 flex items-center gap-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-xs text-gray-500 border-t pt-3">
          ID format: yymmdd + first 2 letters + number. This is an example format guideline.
        </div>
        {confirmClear && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-5 w-full max-w-sm relative">
              <button onClick={() => setConfirmClear(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Clear all assets?</h3>
              <p className="text-sm text-gray-600 mb-4">This will remove all items from inventory.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmClear(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button
                  onClick={() => {
                    setConfirmClear(false);
                    clearAll();
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
        {!!confirmDeleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-5 w-full max-w-sm relative">
              <button onClick={() => setConfirmDeleteId('')} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Remove this asset?</h3>
              <p className="text-sm text-gray-600 mb-4">{confirmDeleteId}</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteId('')} className="px-3 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button
                  onClick={() => {
                    const id = confirmDeleteId;
                    setConfirmDeleteId('');
                    removeItem(id);
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;
