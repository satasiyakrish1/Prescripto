import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  Activity,
  Flame,
  Footprints,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Calendar
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GoogleFitData = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();
  const [fitnessData, setFitnessData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial check
  useEffect(() => {
    checkGoogleFitConnection();
  }, []);

  // Fetch data on change
  useEffect(() => {
    if (isConnected) {
      getFitnessData();
    }
  }, [dateRange, isConnected, startDate, endDate, useCustomDate]);

  const checkGoogleFitConnection = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/google-fit/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsConnected(data.isConnected);
    } catch (error) {
      console.error('Error checking Google Fit connection:', error);
    }
  }, [backendUrl, token]);

  const connectGoogleFit = useCallback(async () => {
    if (!backendUrl || !token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/google-fit/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to initiate connection');
      }
    } catch (error) {
      toast.error('Connection failed');
    }
  }, [backendUrl, token]);

  const getFitnessData = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `${backendUrl}/api/user/google-fit/data`;
      if (useCustomDate && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += `?days=${dateRange}`;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000
      });

      if (data.success && data.data) {
        setFitnessData(data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.data?.requiresReauth) {
        setIsConnected(false);
      }
      setFitnessData(null);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, token, dateRange, useCustomDate, startDate, endDate]);

  // Calculate Trends
  const trends = useMemo(() => {
    if (!fitnessData?.daily || fitnessData.daily.length < 2) return null;

    const calculateTrend = (metric) => {
      const total = fitnessData.summary[metric] || 0;
      const avg = total / fitnessData.daily.length;
      const lastDay = fitnessData.daily[fitnessData.daily.length - 1][metric] || 0;
      const diff = lastDay - avg;
      const percent = avg > 0 ? (diff / avg) * 100 : 0;
      return {
        value: Math.abs(percent).toFixed(1),
        isPositive: diff >= 0,
        direction: diff >= 0 ? 'above avg' : 'below avg'
      };
    };

    return {
      steps: calculateTrend('steps'),
      calories: calculateTrend('calories'),
      distance: calculateTrend('distance'),
      activeMinutes: calculateTrend('activeMinutes')
    };
  }, [fitnessData]);

  // Chart Data
  const stepsChartData = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(day => {
        const [year, month, d] = day.date.split('-').map(Number);
        return new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
      }),
      datasets: [{
        label: 'Steps',
        data: fitnessData.daily.map(day => day.steps),
        borderColor: '#6366f1', // Indigo-500
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#6366f1',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }]
    };
  }, [fitnessData]);

  const caloriesChartData = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(day => {
        const [year, month, d] = day.date.split('-').map(Number);
        return new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
      }),
      datasets: [{
        label: 'Calories',
        data: fitnessData.daily.map(day => day.calories),
        backgroundColor: '#f43f5e', // Rose-500
        borderRadius: 4,
        barThickness: 12,
      }]
    };
  }, [fitnessData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        displayColors: false,
        intersect: false,
        mode: 'index',
      }
    },
    scales: {
      y: {
        display: false, // Minimalistic: hide y-axis
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#9ca3af' }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png"
              alt="Google Fit"
              className="w-7 h-7"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Fitness Activity</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-500 font-medium">
                {isConnected ? 'Synced with Google Fit' : 'Not connected'}
              </span>
            </div>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
              {['7', '30', '90'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setUseCustomDate(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${!useCustomDate && dateRange === range
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                      : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {range}D
                </button>
              ))}
              <button
                onClick={() => setUseCustomDate(!useCustomDate)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${useCustomDate
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Custom
              </button>
            </div>
            {/* ── View Full Analysis ── */}
            <button
              onClick={() => navigate('/fitness-analysis')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm"
            >
              Full Analysis
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogleFit}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-3 shadow-xl shadow-gray-200"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-4 h-4" alt="G" />
            Connect Google Fit
          </button>
        )}
      </div>

      {useCustomDate && isConnected && (
        <div className="flex items-center justify-end gap-3 mb-8">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-gray-200 outline-none"
          />
          <span className="text-gray-300 font-medium">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-gray-200 outline-none"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-medium text-sm">Syncing data...</p>
        </div>
      ) : isConnected && fitnessData?.summary ? (
        <div className="space-y-10">
          {/* Summary Grid - Ultra Minimal */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Steps */}
            <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                  <Footprints className="w-6 h-6" />
                </div>
                {trends?.steps && (
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${trends.steps.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trends.steps.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trends.steps.value}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {(fitnessData.summary.steps || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 font-medium">Steps taken</p>
              </div>
            </div>

            {/* Calories */}
            <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                {trends?.calories && (
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${trends.calories.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trends.calories.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trends.calories.value}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {(fitnessData.summary.calories || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 font-medium">Calories burned</p>
              </div>
            </div>

            {/* Distance */}
            <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                {trends?.distance && (
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${trends.distance.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trends.distance.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trends.distance.value}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {(fitnessData.summary.distance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 font-medium">Kilometers</p>
              </div>
            </div>

            {/* Active Minutes */}
            <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                {trends?.activeMinutes && (
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${trends.activeMinutes.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trends.activeMinutes.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trends.activeMinutes.value}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {Math.floor((fitnessData.summary.activeMinutes || 0) / 60)}h {(fitnessData.summary.activeMinutes || 0) % 60}m
                </p>
                <p className="text-sm text-gray-400 font-medium">Active time</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl border border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Steps Overview
                </h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last {dateRange} Days</span>
              </div>
              <div className="h-[220px]">
                {stepsChartData && <Line data={stepsChartData} options={chartOptions} />}
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  Calories Burned
                </h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last {dateRange} Days</span>
              </div>
              <div className="h-[220px]">
                {caloriesChartData && <Bar data={caloriesChartData} options={chartOptions} />}
              </div>
            </div>
          </div>
        </div>
      ) : !isConnected ? (
        <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Google_Fit_icon_%282018%29.svg/512px-Google_Fit_icon_%282018%29.svg.png"
              alt="Google Fit"
              className="w-10 h-10 opacity-50 grayscale"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Connect Google Fit</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            Sync your daily activity to track your steps, calories, and distance directly from your dashboard.
          </p>
          <button
            onClick={connectGoogleFit}
            className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10"
          >
            Connect Now
          </button>
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-gray-400 font-medium">No data available for this period.</p>
          <button
            onClick={getFitnessData}
            className="mt-4 text-indigo-600 text-sm font-bold hover:text-indigo-700"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleFitData;