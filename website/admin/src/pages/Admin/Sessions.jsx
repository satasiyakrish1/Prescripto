import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const Sessions = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const heartbeatRef = useRef(null);
  const pollRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const token = aToken || localStorage.getItem('aToken');
      const { data } = await axios.get(`${backendUrl}/api/admin/sessions`, { headers: { aToken: token } });
      if (data.success) setSessions(data.data);
    } catch (e) {
      // silently ignore for UX
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id) => {
    try {
      const token = aToken || localStorage.getItem('aToken');
      const { data } = await axios.post(`${backendUrl}/api/admin/sessions/${id}/revoke`, {}, { headers: { aToken: token } });
      if (data.success) {
        toast.success('Session ended');
        fetchSessions();
      }
    } catch {
      toast.error('Failed to end session');
    }
  };

  const revokeOthers = async () => {
    try {
      const token = aToken || localStorage.getItem('aToken');
      const { data } = await axios.post(`${backendUrl}/api/admin/sessions/revoke-others`, {}, { headers: { aToken: token } });
      if (data.success) {
        toast.success('Other sessions ended');
        fetchSessions();
      }
    } catch {
      toast.error('Failed to end other sessions');
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(async () => {
      try {
        const token = aToken || localStorage.getItem('aToken');
        await axios.post(`${backendUrl}/api/admin/sessions/heartbeat`, {}, { headers: { aToken: token } });
      } catch {
        // no-op
      }
    }, 20000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(fetchSessions, 10000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchSessions();
    startHeartbeat();
    startPolling();
    return () => {
      stopHeartbeat();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Recent Sessions</h1>
          <p className="text-gray-500 text-sm">Live activity from all admin logins</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSessions} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Refresh</button>
          <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Back</button>
          <button onClick={revokeOthers} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">End Other Sessions</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
        {loading ? (
          <div className="text-gray-500">Loading sessions…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Device</th>
                  <th className="py-2">IP</th>
                  <th className="py-2">Issued</th>
                  <th className="py-2">Last Seen</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id} className="border-b">
                    <td className="py-2">{s.deviceInfo || 'Unknown'}</td>
                    <td className="py-2">{s.ipAddress || 'Unknown'}</td>
                    <td className="py-2">{s.issuedAt ? new Date(s.issuedAt).toLocaleString() : '—'}</td>
                    <td className="py-2">{s.lastSeen ? new Date(s.lastSeen).toLocaleString() : '—'}</td>
                    <td className="py-2">
                      {s.revoked ? <span className="text-red-600">Revoked</span> : <span className="text-green-600">Active</span>}
                    </td>
                    <td className="py-2">
                      {!s.revoked ? (
                        <button onClick={() => revokeSession(s._id)} className="px-3 py-1 rounded-md border hover:bg-gray-50">End</button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td className="py-6 text-gray-500" colSpan={6}>No sessions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
