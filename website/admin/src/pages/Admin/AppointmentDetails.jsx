import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { Calendar, ArrowLeft, User, Stethoscope, Clock, Pill, Receipt } from 'lucide-react';

const AppointmentDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (isNaN(date.getTime())) {
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
    }
    if (isNaN(date.getTime())) return dateStr + (timeStr ? ', ' + timeStr : '');
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    let formattedTime = timeStr;
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return `${day} ${month} ${year}${formattedTime ? ', ' + formattedTime : ''}`;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/api/admin/appointments/${appointmentId}`, {
          headers: { aToken }
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [appointmentId, backendUrl, aToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-16 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-primary bg-blue-100">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading appointment...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-16 text-center text-gray-600">Appointment not found</div>
        </div>
      </div>
    );
  }

  const { appointment, prescription, pharmacySales } = data;
  const computedStatus = appointment.status || (appointment.cancelled ? 'cancelled' : appointment.isCompleted ? 'completed' : 'booked');
  const isCancelled = computedStatus === 'cancelled';
  const isCompleted = computedStatus === 'completed';
  const statusColor =
    isCancelled ? 'bg-red-50 text-red-700 border-red-100' :
    isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    'bg-blue-50 text-blue-700 border-blue-100';
  const statusLabel =
    isCancelled ? 'Cancelled' :
    isCompleted ? 'Completed' :
    'Booked';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/all-appointments')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="text-gray-600" />
            <span className="hidden sm:inline">Back to appointments</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Appointment</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">ID: {appointment._id}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}>
              <Clock className="w-3 h-3 mr-1.5" />
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Patient</h3>
            </div>
            <div className="flex items-center gap-3">
              <img src={appointment.userData.image} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
              <div>
                <div className="text-sm font-medium text-gray-900">{appointment.userData.name}</div>
                <div className="text-xs text-gray-600">{appointment.userData.email}</div>
                {appointment.userData.phone && <div className="text-xs text-gray-500">{appointment.userData.phone}</div>}
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Doctor</h3>
            </div>
            <div className="flex items-center gap-3">
              <img src={appointment.docData.image} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
              <div>
                <div className="text-sm font-medium text-gray-900">Dr. {appointment.docData.name}</div>
                <div className="text-xs text-gray-600">{appointment.docData.speciality || 'Consultation'}</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Schedule & Billing</h3>
            </div>
            <div className="text-sm text-gray-900 font-medium">{formatDateTime(appointment.slotDate, appointment.slotTime)}</div>
            {appointment.scheduledAt && (
              <div className="mt-1 text-xs text-gray-500">Scheduled at {new Date(appointment.scheduledAt).toLocaleString()}</div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-medium">
                ₹{appointment.amount}
              </span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Prescription</h3>
              </div>
              {prescription?.googleDrive?.fileUrl && (
                <a href={prescription.googleDrive.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View file
                </a>
              )}
            </div>
            {!prescription ? (
              <div className="text-sm text-gray-500">No prescription recorded</div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Diagnosis: </span>
                  <span>{prescription.diagnosis}</span>
                </div>
                <div className="text-sm text-gray-700 font-medium">Medications</div>
                <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/60">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Dosage</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Frequency</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.medications?.map((m, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{m.name}</td>
                          <td className="px-3 py-2 text-gray-700">{m.dosage}</td>
                          <td className="px-3 py-2 text-gray-700">{m.frequency}</td>
                          <td className="px-3 py-2 text-gray-700">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Pharmacy Purchases</h3>
              </div>
            </div>
            {!pharmacySales || pharmacySales.length === 0 ? (
              <div className="text-sm text-gray-500">No related pharmacy sales</div>
            ) : (
              <div className="space-y-3">
                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/60">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Invoice</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Date</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pharmacySales.map(s => (
                        <tr key={s._id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{s.invoice_id}</td>
                          <td className="px-3 py-2 text-gray-700">{new Date(s.sold_at || s.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-gray-900">₹{Number(s.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
