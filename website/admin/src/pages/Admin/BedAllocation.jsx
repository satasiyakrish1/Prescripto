import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Bed, ChevronLeft, Plus, ArrowRight, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

/* ─── status pill colours ─── */
const STATUS_STYLES = {
  available: { dot: '#16a34a', bg: '#f0fdf4', text: '#15803d', label: 'Available' },
  occupied: { dot: '#2563eb', bg: '#eff6ff', text: '#1d4ed8', label: 'Occupied' },
  maintenance: { dot: '#d97706', bg: '#fffbeb', text: '#b45309', label: 'Maintenance' },
  reserved: { dot: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9', label: 'Reserved' },
  cleaning: { dot: '#0891b2', bg: '#ecfeff', text: '#0e7490', label: 'Cleaning' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || { dot: '#6b7280', bg: '#f9fafb', text: '#374151', label: status };
  return (
    <span style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
      <span style={{ background: s.dot }} className="w-1.5 h-1.5 rounded-full" />
      {s.label}
    </span>
  );
};

/* ─── mini progress bar ─── */
const OccupancyBar = ({ occupied, total }) => {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{pct}% occupied</span>
        <span>{occupied}/{total}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
      </div>
    </div>
  );
};

/* ─── modal wrapper ─── */
const Modal = ({ open, onClose, title, children, footer }) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <Dialog.Title className="text-base font-semibold text-gray-900">{title}</Dialog.Title>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5">{children}</div>
              {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

/* ─── shared input / select styles ─── */
const inputCls = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all';
const BtnPrimary = ({ onClick, children, className = '' }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors ${className}`}>{children}</button>
);
const BtnSecondary = ({ onClick, children }) => (
  <button onClick={onClick} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">{children}</button>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const BedAllocation = () => {
  const { darkMode } = useTheme();
  const { aToken, handle401Error, doctors: allDoctors, isReadOnly } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const { wardId } = useParams();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [floors, setFloors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [activeBed, setActiveBed] = useState(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [admissionType, setAdmissionType] = useState('Scheduled');
  const [expectedDischargeDate, setExpectedDischargeDate] = useState('');
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('available');
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', age: '', gender: 'male', contactNumber: '', diagnosis: '' });
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [isBedFormOpen, setIsBedFormOpen] = useState(false);
  const [bedFormMode, setBedFormMode] = useState('create');
  const [bedFormRoom, setBedFormRoom] = useState(null);
  const [bedFormBed, setBedFormBed] = useState(null);
  const [bedNumberInput, setBedNumberInput] = useState('');
  const [isBedDeleteOpen, setIsBedDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isWardDeleteOpen, setIsWardDeleteOpen] = useState(false);
  const [deleteWardTarget, setDeleteWardTarget] = useState(null);
  const [expandedRoomIds, setExpandedRoomIds] = useState([]);
  const [isWardFormOpen, setIsWardFormOpen] = useState(false);
  const [wardName, setWardName] = useState('');
  const [wardType, setWardType] = useState('general');
  const [wardFloor, setWardFloor] = useState('');
  const [wardDepartment, setWardDepartment] = useState('');
  const [wardCapacity, setWardCapacity] = useState('');
  const [wardDescription, setWardDescription] = useState('');

  /* ── data fetching ── */
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [occ, fl] = await Promise.all([
        axios.get(`${backendUrl}/api/bed-allocation/occupancy-summary`, { headers: { aToken } }),
        axios.get(`${backendUrl}/api/bed-allocation/floors`, { headers: { aToken } }),
      ]);
      setSummary(occ.data.summary);
      setFloors(fl.data.floors || []);
    } catch (err) { if (!handle401Error(err)) console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/bed-allocation/departments`, { headers: { aToken } });
      const list = Array.isArray(res.data) ? res.data : res.data.departments || [];
      setDepartments(list.map(d => d.name || d));
    } catch (err) { if (!handle401Error(err)) console.error(err); }
  };

  useEffect(() => { fetchOverview(); fetchDepartments(); }, [aToken]);

  /* ── derived data ── */
  const filteredRooms = useMemo(() => {
    let rooms = [];
    floors.forEach(f => (f.rooms || []).forEach(r => rooms.push(r)));
    if (selectedDepartment !== 'all') rooms = rooms.filter(r => r.department === selectedDepartment);
    if (wardId) rooms = rooms.filter(r => String(r.wardId) === String(wardId));
    return rooms.map(r => ({ ...r, beds: r.beds.filter(b => statusFilter === 'all' || b.status === statusFilter) }));
  }, [floors, selectedDepartment, statusFilter, wardId]);

  const departmentStats = useMemo(() => {
    const map = {};
    floors.forEach(f => f.rooms.forEach(room => {
      const dept = room.department || 'Unknown';
      if (!map[dept]) map[dept] = { name: dept, totalBeds: 0, occupied: 0, available: 0, maintenance: 0 };
      const beds = room.beds || [];
      map[dept].totalBeds += room.totalBeds || beds.length;
      map[dept].occupied += beds.filter(b => b.status === 'occupied').length;
      map[dept].available += beds.filter(b => b.status === 'available').length;
      map[dept].maintenance += beds.filter(b => b.status === 'maintenance').length;
    }));
    return Object.values(map);
  }, [floors]);

  const selectedWardRoom = useMemo(() => (wardId ? filteredRooms[0] || null : null), [filteredRooms, wardId]);
  const isWardView = !!selectedWardRoom;

  /* ── actions ── */
  const openAllocate = async (room, bed) => {
    if (isReadOnly) return;
    setActiveBed({ room, bed });
    setSelectedPatient(null); setSelectedDoctor(null);
    setIsNewPatient(false); setShowAllDoctors(false);
    setRegForm({ name: '', age: '', gender: 'male', contactNumber: '', diagnosis: '' });
    setAdmissionType('Scheduled'); setExpectedDischargeDate(''); setNotes('');
    setPatientQuery(''); setPatientResults([]);
    try {
      setDoctors([]);
      const res = await axios.get(`${backendUrl}/api/bed-allocation/doctors/department/${room.department}`, { headers: { aToken } });
      const list = Array.isArray(res.data) ? res.data : res.data.doctors || [];
      setDeptDoctors(list);

      if (list.length > 0) {
        setDoctors(list);
        setShowAllDoctors(false);
      } else {
        console.warn('No doctors for dept, falling back to all');
        setDoctors(allDoctors || []);
        setShowAllDoctors(true);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setDoctors(allDoctors || []);
      setShowAllDoctors(true);
    }
    setIsAllocateOpen(true);
  };

  const searchPatients = async (q) => {
    setPatientQuery(q);
    if (!q || q.length < 2) { setPatientResults([]); return; }
    try {
      const res = await axios.get(`${backendUrl}/api/bed-allocation/patients/search?query=${encodeURIComponent(q)}`, { headers: { aToken } });
      const results = Array.isArray(res.data) ? res.data : res.data.patients || [];
      setPatientResults(results);
      if (results.length === 0) toast.info('No patients found matching your query');
    } catch (err) {
      if (!handle401Error(err)) {
        console.error('Search error:', err);
        toast.error(err.response?.data?.message || 'Failed to search patients');
      }
    }
  };

  const confirmAllocate = async () => {
    if (isReadOnly) return;
    if (!activeBed || !selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    let pId = selectedPatient?._id;

    if (isNewPatient) {
      if (!regForm.name || !regForm.age || !regForm.contactNumber || !regForm.diagnosis) {
        toast.error('All patient fields (Name, Age, Contact, Diagnosis) are required');
        return;
      }
      try {
        const res = await axios.post(`${backendUrl}/api/patients`, regForm, { headers: { aToken } });
        const newPatient = res.data?.patient || res.data;
        if (newPatient && (newPatient._id || newPatient.id)) {
          pId = newPatient._id || newPatient.id;
        } else {
          toast.error('Server returned invalid patient data');
          return;
        }
      } catch (err) {
        console.error('Patient creation error:', err);
        toast.error(err.response?.data?.message || 'Failed to create patient profile');
        return;
      }
    }

    if (!pId) {
      toast.error('Please select or register a patient');
      return;
    }

    try {
      await axios.post(`${backendUrl}/api/bed-allocation/allocate`, {
        wardId: activeBed.room.wardId, bedId: activeBed.bed.bedId,
        patientId: pId, doctorId: selectedDoctor._id,
        admissionType, expectedDischargeDate: expectedDischargeDate || null, notes,
      }, { headers: { aToken } });
      setIsAllocateOpen(false); fetchOverview();
      toast.success('Bed allocated successfully');
    } catch (err) {
      if (!handle401Error(err)) {
        console.error('Allocation error:', err);
        toast.error(err.response?.data?.message || 'Failed to allocate bed');
      }
    }
  };

  const openStatus = (room, bed) => { setActiveBed({ room, bed }); setNewStatus(bed.status); setIsStatusOpen(true); };
  const confirmStatus = async () => {
    if (!activeBed) return;
    try {
      await axios.put(`${backendUrl}/api/bed-allocation/beds/${activeBed.room.wardId}/${activeBed.bed.bedId}/status`, { status: newStatus }, { headers: { aToken } });
      setIsStatusOpen(false); fetchOverview();
    } catch (err) { if (!handle401Error(err)) console.error(err); }
  };

  const openDischarge = (room, bed) => {
    if (isReadOnly) return;
    setActiveBed({ room, bed });
    setIsDischargeOpen(true);
  };
  const confirmDischarge = async () => {
    if (!activeBed || isReadOnly) return;
    try {
      const res = await axios.get(`${backendUrl}/api/bed-allocation/admissions`, { headers: { aToken } });
      const admissions = Array.isArray(res.data) ? res.data : res.data.admissions || [];
      const match = admissions.find(a =>
        String(a.wardId?._id || a.wardId) === String(activeBed.room.wardId) &&
        String(a.bedId) === String(activeBed.bed.bedId) &&
        !a.dischargeDate && (a.status === 'Active' || a.status === 'active')
      );
      if (!match) { setIsDischargeOpen(false); return; }
      await axios.post(`${backendUrl}/api/bed-allocation/discharge`, { admissionId: match._id }, { headers: { aToken } });
      setIsDischargeOpen(false); fetchOverview();
    } catch (err) { if (!handle401Error(err)) console.error(err); }
  };

  const openDeleteWard = (room) => { setDeleteWardTarget(room); setIsWardDeleteOpen(true); };
  const confirmDeleteWard = async () => {
    if (!deleteWardTarget || isReadOnly) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/ward/${deleteWardTarget.wardId}`, { headers: { aToken } });
      if (data.message || data.success) {
        toast.success(data.message || 'Ward deleted successfully');
        setIsWardDeleteOpen(false); setDeleteWardTarget(null);
        if (wardId) navigate('/bed-allocation');
        else fetchOverview();
      } else {
        toast.error(data.message || 'Failed to delete ward');
      }
    } catch (err) {
      if (!handle401Error(err)) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error deleting ward');
      }
    }
  };

  const openDepartment = (dept) => { setActiveDepartment(dept); setSelectedDepartment(dept); };
  const resetToOverview = () => { setActiveDepartment(null); setSelectedDepartment('all'); if (wardId) navigate('/bed-allocation'); };

  const openCreateBed = (room) => { setBedFormMode('create'); setBedFormRoom(room); setBedFormBed(null); setBedNumberInput(String((room.totalBeds || room.beds.length || 0) + 1)); setIsBedFormOpen(true); };
  const openEditBed = (room, bed) => { setBedFormMode('edit'); setBedFormRoom(room); setBedFormBed(bed); setBedNumberInput(String(bed.bedNumber || '')); setIsBedFormOpen(true); };

  const submitBedForm = async () => {
    if (!bedFormRoom || !bedNumberInput.trim() || isReadOnly) return;
    try {
      let res;
      if (bedFormMode === 'create') res = await axios.post(`${backendUrl}/api/bed-allocation/beds/${bedFormRoom.wardId}`, { bedNumber: bedNumberInput.trim() }, { headers: { aToken } });
      else if (bedFormBed) res = await axios.put(`${backendUrl}/api/bed-allocation/beds/${bedFormRoom.wardId}/${bedFormBed.bedId}`, { bedNumber: bedNumberInput.trim() }, { headers: { aToken } });

      toast.success(res.data.message || 'Bed saved successfully');
      setIsBedFormOpen(false); setBedFormRoom(null); setBedFormBed(null); setBedNumberInput(''); fetchOverview();
    } catch (err) {
      if (!handle401Error(err)) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error saving bed');
      }
    }
  };

  const openAllocateFromRoom = (room) => { const b = (room.beds || []).find(b => b.status === 'available'); if (b) openAllocate(room, b); };
  const openAllocateFromDepartment = (deptName) => {
    let chosen = null;
    floors.forEach(f => f.rooms.forEach(r => { if (!chosen && r.department === deptName && (r.beds || []).some(b => b.status === 'available')) chosen = r; }));
    if (!chosen) return;
    setActiveDepartment(deptName); setSelectedDepartment(deptName);
    const b = (chosen.beds || []).find(b => b.status === 'available');
    if (b) openAllocate(chosen, b);
  };

  const toggleRoomExpanded = (id) => setExpandedRoomIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const openDeleteBed = (room, bed) => { setDeleteTarget({ room, bed }); setIsBedDeleteOpen(true); };
  const confirmDeleteBed = async () => {
    if (!deleteTarget || isReadOnly) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/bed-allocation/beds/${deleteTarget.room.wardId}/${deleteTarget.bed.bedId}`, { headers: { aToken } });
      toast.success(data.message || 'Bed deleted successfully');
      setIsBedDeleteOpen(false); setDeleteTarget(null); fetchOverview();
    } catch (err) {
      if (!handle401Error(err)) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error deleting bed');
      }
    }
  };

  const openWardForm = () => { setWardName(''); setWardType('general'); setWardFloor(''); setWardDepartment(''); setWardCapacity(''); setWardDescription(''); setIsWardFormOpen(true); };
  const submitWardForm = async () => {
    if (!wardName.trim() || !wardDepartment.trim() || !wardCapacity || isReadOnly) return;
    const cap = Number(wardCapacity);
    if (!cap || cap <= 0) return;
    try {
      const { data } = await axios.post(`${backendUrl}/api/ward/create`, { name: wardName.trim(), type: wardType, floor: wardFloor ? Number(wardFloor) : undefined, department: wardDepartment.trim(), capacity: cap, description: wardDescription.trim() || undefined }, { headers: { aToken } });
      toast.success(data.message || 'Ward created successfully');
      setIsWardFormOpen(false); fetchOverview(); fetchDepartments();
    } catch (err) {
      if (!handle401Error(err)) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error creating ward');
      }
    }
  };

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50/60'} px-6 py-8`}>
      <div className="max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            {isWardView || activeDepartment ? (
              <button onClick={resetToOverview} className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-white'} transition-colors`}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <Bed className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              </div>
            )}
            <div>
              <h1 className={`text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isWardView && selectedWardRoom
                  ? selectedWardRoom.roomNumber
                  : activeDepartment
                    ? activeDepartment
                    : 'Bed Allocation'}
              </h1>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {isWardView && selectedWardRoom
                  ? `${selectedWardRoom.department} · ${selectedWardRoom.wardType}`
                  : activeDepartment
                    ? 'Beds & allocations'
                    : 'Monitor bed occupancy and availability'}
              </p>
            </div>
          </div>

          {!isWardView && (
            <div className="flex items-center gap-2">
              {/* Filters */}
              <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-gray-200`}>
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-gray-200`}>
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button onClick={openWardForm}
                className={`h-9 inline-flex items-center gap-1.5 px-4 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                <Plus className="w-3.5 h-3.5" /> Create ward
              </button>
            </div>
          )}
        </div>

        {/* ── Summary Stats (overview only) ── */}
        {!isWardView && !activeDepartment && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Beds', value: summary?.totalBeds, color: darkMode ? 'text-white' : 'text-gray-900' },
              { label: 'Available', value: summary?.available, color: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
              { label: 'Occupied', value: summary?.occupied, color: darkMode ? 'text-blue-400' : 'text-blue-600' },
              { label: 'Maintenance', value: summary?.maintenance, color: darkMode ? 'text-amber-400' : 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border p-5`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                <p className={`text-3xl font-bold mt-2 tabular-nums ${color}`}>{value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-24">
            <div className={`w-8 h-8 border-2 ${darkMode ? 'border-gray-700 border-t-gray-300' : 'border-gray-200 border-t-gray-600'} rounded-full animate-spin`} />
          </div>
        )}

        {/* ── Ward Detail View ── */}
        {!loading && isWardView && selectedWardRoom && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border overflow-hidden`}>
            {/* ward header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <div className="flex gap-6 text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Total <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedWardRoom.totalBeds}</span>
                </span>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Occupied <span className="font-semibold text-blue-500">{selectedWardRoom.occupiedBeds}</span>
                </span>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Available <span className="font-semibold text-emerald-500">{selectedWardRoom.availableBeds}</span>
                </span>
              </div>
              <div className="flex gap-2">
                {!isReadOnly && <button onClick={() => openAllocateFromRoom(selectedWardRoom)} className="h-8 px-3 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">Allocate</button>}
                {!isReadOnly && <button onClick={() => openCreateBed(selectedWardRoom)} className={`h-8 px-3 text-xs rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Add bed
                </button>}
                <button onClick={() => toggleRoomExpanded(selectedWardRoom.wardId)} className={`h-8 px-3 text-xs rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  {expandedRoomIds.includes(selectedWardRoom.wardId) ? 'Hide' : 'Show beds'}
                </button>
                {!isReadOnly && <button onClick={() => openDeleteWard(selectedWardRoom)} className="h-8 px-3 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                  Delete Ward
                </button>}
              </div>
            </div>
            {/* bed table */}
            {expandedRoomIds.includes(selectedWardRoom.wardId) && (
              <BedTable darkMode={darkMode} beds={selectedWardRoom.beds} room={selectedWardRoom} isReadOnly={isReadOnly}
                onAllocate={openAllocate} onDischarge={openDischarge} onStatus={openStatus} onEdit={openEditBed} onDelete={openDeleteBed} />
            )}
          </div>
        )}

        {/* ── Department Cards (overview) ── */}
        {!loading && !isWardView && departmentStats.length > 0 && !activeDepartment && (
          <div className="mb-8">
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Departments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentStats.map(dept => (
                <div key={dept.name}
                  onClick={() => openDepartment(dept.name)}
                  className={`group cursor-pointer rounded-xl border p-5 transition-all duration-200 ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{dept.name}</p>
                      <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dept.totalBeds} <span className={`text-sm font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>beds</span></p>
                    </div>
                    <ArrowRight className={`w-4 h-4 mt-1 transition-transform group-hover:translate-x-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                  <OccupancyBar occupied={dept.occupied} total={dept.totalBeds} />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-500 font-medium">{dept.available} free</span>
                      <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>·</span>
                      <span className="text-blue-500 font-medium">{dept.occupied} used</span>
                    </div>
                    {!isReadOnly && <button onClick={e => { e.stopPropagation(); openAllocateFromDepartment(dept.name); }}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                      Allocate
                    </button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Department Detail ── */}
        {!loading && activeDepartment && !isWardView && (
          <div className="space-y-4">
            {filteredRooms.map(room => (
              <div key={room.wardId} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room.roomNumber}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{room.department} · {room.wardType}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex gap-4 text-sm">
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Total <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room.totalBeds}</span></span>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Occupied <span className="font-semibold text-blue-500">{room.occupiedBeds}</span></span>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Available <span className="font-semibold text-emerald-500">{room.availableBeds}</span></span>
                    </div>
                    <div className="flex gap-2">
                      {!isReadOnly && <button onClick={() => openAllocateFromRoom(room)} className="h-8 px-3 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">Allocate</button>}
                      {!isReadOnly && <button onClick={() => openCreateBed(room)} className={`h-8 px-3 text-xs rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Add bed</button>}
                      <button onClick={() => navigate(`/bed-allocation/ward/${room.wardId}`)} className={`h-8 px-3 text-xs rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Open</button>
                      {!isReadOnly && <button onClick={() => openDeleteWard(room)} className="h-8 px-3 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Delete</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Allocate */}
      <Modal open={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} title="Allocate Bed"
        footer={<><BtnSecondary onClick={() => setIsAllocateOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={confirmAllocate}>Confirm Allocation</BtnPrimary></>}>
        <div className="space-y-4">
          {/* Patient Selection Tabs */}
          <div className="flex border-b border-gray-100 mb-2">
            <button onClick={() => setIsNewPatient(false)} className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${!isNewPatient ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Existing Patient</button>
            <button onClick={() => setIsNewPatient(true)} className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${isNewPatient ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>New Patient</button>
          </div>

          {!isNewPatient ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Search Patient</label>
              <input value={patientQuery} onChange={e => searchPatients(e.target.value)} placeholder="Name or phone number…" className={inputCls} />
              {patientResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden shadow-sm max-h-40 overflow-y-auto">
                  {patientResults.map(p => (
                    <button key={p._id} onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientQuery(p.name); toast.success(`Selected: ${p.name}`); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{p.patientId || 'No ID'}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{p.contactNumber}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="font-medium truncate max-w-[200px]">{selectedPatient.name}</span>
                  <button onClick={() => setSelectedPatient(null)} className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Full Name</label>
                <input value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="Patient Name" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Age</label>
                <input type="number" value={regForm.age} onChange={e => setRegForm({ ...regForm, age: e.target.value })} placeholder="Age" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Gender</label>
                <select value={regForm.gender} onChange={e => setRegForm({ ...regForm, gender: e.target.value })} className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Contact Number</label>
                <input value={regForm.contactNumber} onChange={e => setRegForm({ ...regForm, contactNumber: e.target.value })} placeholder="Phone number" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Diagnosis</label>
                <input value={regForm.diagnosis} onChange={e => setRegForm({ ...regForm, diagnosis: e.target.value })} placeholder="e.g. Fever, Fracture" className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-gray-500">Attending Doctor</label>
              <button
                onClick={() => {
                  if (showAllDoctors) {
                    setDoctors(deptDoctors);
                    setShowAllDoctors(false);
                  } else {
                    setDoctors(allDoctors);
                    setShowAllDoctors(true);
                  }
                }}
                className="text-[10px] text-blue-600 hover:underline"
              >
                {showAllDoctors ? 'Back to Dept' : 'Show All Doctors'}
              </button>
            </div>
            <select value={selectedDoctor?._id || ''} onChange={e => setSelectedDoctor((showAllDoctors ? allDoctors : doctors).find(d => d._id === e.target.value) || null)} className={inputCls}>
              <option value="">Select doctor</option>
              {(showAllDoctors ? allDoctors : doctors).map(d => <option key={d._id} value={d._id}>{d.name} ({d.speciality})</option>)}
            </select>
            {doctors.length === 0 && !showAllDoctors && (
              <p className="mt-1 text-[10px] text-amber-600 font-medium">No doctors found for this department. Try "Show All Doctors".</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Admission Type</label>
              <select value={admissionType} onChange={e => setAdmissionType(e.target.value)} className={inputCls}>
                <option>Scheduled</option>
                <option>Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Expected Discharge</label>
              <input type="date" value={expectedDischargeDate} onChange={e => setExpectedDischargeDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" rows={2} className={inputCls + ' resize-none'} />
          </div>
        </div>
      </Modal>

      {/* Update Status */}
      <Modal open={isStatusOpen} onClose={() => setIsStatusOpen(false)} title="Update Bed Status"
        footer={<><BtnSecondary onClick={() => setIsStatusOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={confirmStatus}>Update</BtnPrimary></>}>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">New Status</label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={inputCls}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </Modal>

      {/* Discharge */}
      <Modal open={isDischargeOpen} onClose={() => setIsDischargeOpen(false)} title="Confirm Discharge"
        footer={<><BtnSecondary onClick={() => setIsDischargeOpen(false)}>Cancel</BtnSecondary>
          <button onClick={confirmDischarge} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Discharge Patient</button></>}>
        <p className="text-sm text-gray-500">This will free the bed and mark the patient as discharged. This action cannot be undone.</p>
      </Modal>

      {/* Add / Edit Bed */}
      <Modal open={isBedFormOpen} onClose={() => setIsBedFormOpen(false)} title={bedFormMode === 'create' ? 'Add Bed' : 'Edit Bed'}
        footer={<><BtnSecondary onClick={() => setIsBedFormOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={submitBedForm}>Save</BtnPrimary></>}>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Bed Number</label>
          <input value={bedNumberInput} onChange={e => setBedNumberInput(e.target.value)} placeholder="e.g. A-101" className={inputCls} />
        </div>
      </Modal>

      {/* Delete Bed */}
      <Modal open={isBedDeleteOpen} onClose={() => setIsBedDeleteOpen(false)} title="Delete Bed"
        footer={<><BtnSecondary onClick={() => setIsBedDeleteOpen(false)}>Cancel</BtnSecondary>
          <button onClick={confirmDeleteBed} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Delete</button></>}>
        <p className="text-sm text-gray-500">This will permanently remove the bed from the ward. Beds with active patients cannot be deleted.</p>
      </Modal>

      {/* Delete Ward */}
      <Modal open={isWardDeleteOpen} onClose={() => setIsWardDeleteOpen(false)} title="Delete Ward"
        footer={<><BtnSecondary onClick={() => setIsWardDeleteOpen(false)}>Cancel</BtnSecondary>
          <button onClick={confirmDeleteWard} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Delete Ward</button></>}>
        <p className="text-sm text-gray-500">Are you sure you want to delete this ward? This action will permanently remove the ward and all its beds. Wards with active patients cannot be deleted.</p>
      </Modal>

      {/* Create Ward */}
      <Modal open={isWardFormOpen} onClose={() => setIsWardFormOpen(false)} title="Create Ward"
        footer={<><BtnSecondary onClick={() => setIsWardFormOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={submitWardForm}>Save Ward</BtnPrimary></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ward Name</label>
            <input value={wardName} onChange={e => setWardName(e.target.value)} placeholder="e.g. Ward A" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
            <input value={wardDepartment} onChange={e => setWardDepartment(e.target.value)} placeholder="e.g. Cardiology" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ward Type</label>
            <select value={wardType} onChange={e => setWardType(e.target.value)} className={inputCls}>
              <option value="general">General</option>
              <option value="icu">ICU</option>
              <option value="operation_theater">Operation Theater</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Floor</label>
            <input type="number" value={wardFloor} onChange={e => setWardFloor(e.target.value)} placeholder="e.g. 2" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Number of Beds</label>
            <input type="number" value={wardCapacity} onChange={e => setWardCapacity(e.target.value)} placeholder="e.g. 20" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description <span className="text-gray-300">(optional)</span></label>
            <textarea value={wardDescription} onChange={e => setWardDescription(e.target.value)} placeholder="Brief description…" rows={3} className={inputCls + ' resize-none'} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ── Bed Table sub-component ── */
const BedTable = ({ darkMode, beds, room, isReadOnly, onAllocate, onDischarge, onStatus, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className={darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}>
          {['Bed', 'Status', 'Patient', ...(!isReadOnly ? ['Actions'] : [])].map(h => (
            <th key={h} className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-50'}`}>
        {beds.map(b => (
          <tr key={b.bedId} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50/80'}`}>
            <td className={`px-6 py-4 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{b.bedNumber}</td>
            <td className="px-6 py-4"><StatusPill status={b.status} /></td>
            <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{b.patient?.name || <span className="text-gray-300">—</span>}</td>
            {!isReadOnly && <td className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {b.status === 'available' && (
                  <button onClick={() => onAllocate(room, b)} className="px-3 py-1 text-xs rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors">Allocate</button>
                )}
                {b.status === 'occupied' && (
                  <button onClick={() => onDischarge(room, b)} className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Discharge</button>
                )}
                <button onClick={() => onStatus(room, b)} className={`px-3 py-1 text-xs rounded-md border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Status</button>
                <button onClick={() => onEdit(room, b)} className={`px-3 py-1 text-xs rounded-md border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Edit</button>
                {b.status !== 'occupied' && (
                  <button onClick={() => onDelete(room, b)} className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Delete</button>
                )}
              </div>
            </td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default BedAllocation;
