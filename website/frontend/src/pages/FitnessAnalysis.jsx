import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler
} from 'chart.js';
import {
  Activity, Flame, Footprints, MapPin, Moon, Heart, Droplets,
  TrendingUp, TrendingDown, RefreshCw, ArrowLeft, Zap, Wind,
  Award, Target, BedDouble, ChevronRight, BarChart2, Brain
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler
);

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (n, dec = 0) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: dec });
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
const weekday = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short' });
};

/* ─── Synthetic sleep from active minutes (since Google Fit basic API    */
/* doesn't expose sleep for most users, we derive an estimate)           */
const deriveSleep = (activeMinutes, steps) => {
  // WHO recommendation: 7-9 hours. Active day = better sleep estimate.
  const base = 7 + Math.min(activeMinutes / 120, 1);          // 7–8h
  const deep  = Math.round(base * 0.2 * 10) / 10;             // ~20% deep
  const rem   = Math.round(base * 0.25 * 10) / 10;            // ~25% REM
  const light = Math.round((base - deep - rem) * 10) / 10;    // rest light
  return { total: Math.round(base * 10) / 10, deep, rem, light };
};

/* ─── Synthetic heart-rate zones from calories + active minutes ─────── */
const deriveHRZones = (calories, activeMinutes) => {
  const total = activeMinutes || 1;
  const intense = Math.round(total * 0.25);
  const cardio  = Math.round(total * 0.35);
  const fatBurn = Math.round(total * 0.30);
  const resting = Math.round(total * 0.10);
  return { intense, cardio, fatBurn, resting };
};

/* ─── Chart theme ────────────────────────────────────────────────────── */
const PALETTE = {
  indigo: '#6366f1', teal: '#14b8a6', rose: '#f43f5e',
  amber: '#f59e0b', violet: '#8b5cf6', emerald: '#10b981',
  sky: '#0ea5e9', pink: '#ec4899'
};

const baseChartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827', cornerRadius: 10,
      titleFont: { size: 12, family: 'Inter', weight: 'bold' },
      bodyFont:  { size: 11, family: 'Inter' },
      padding: 12, displayColors: false
    }
  }
};

/* ─── Component ──────────────────────────────────────────────────────── */
const FitnessAnalysis = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [fitnessData, setFitnessData] = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange]     = useState('7');
  const [activeTab, setActiveTab]     = useState('overview');

  /* ── data fetch ────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: status } = await axios.get(
        `${backendUrl}/api/user/google-fit/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsConnected(status.isConnected);
      if (!status.isConnected) { setIsLoading(false); return; }

      const { data } = await axios.get(
        `${backendUrl}/api/user/google-fit/data?days=${dateRange}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 }
      );
      if (data.success && data.data) setFitnessData(data.data);
    } catch (e) {
      if (e.response?.data?.requiresReauth) setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, token, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── derived stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    if (!fitnessData?.daily?.length) return null;
    const days = fitnessData.daily;
    const sum  = fitnessData.summary || {};
    const n    = days.length || 1;

    const avgSteps    = Math.round((sum.steps || 0) / n);
    const avgCal      = Math.round((sum.calories || 0) / n);
    const avgDistance = (sum.distance || 0) / n;
    const avgActive   = Math.round((sum.activeMinutes || 0) / n);
    const bestDay     = [...days].sort((a, b) => (b.steps || 0) - (a.steps || 0))[0];
    const goalPct     = Math.round((avgSteps / 10000) * 100);
    const sleep       = deriveSleep(avgActive, avgSteps);
    const hrZones     = deriveHRZones(sum.calories, sum.activeMinutes);
    const vo2Max      = Math.round(15 + (avgSteps / 1000) * 0.8 + avgActive * 0.15);
    const score       = Math.min(100, Math.round(
      (goalPct * 0.3) + (Math.min(avgCal / 5, 20)) +
      (Math.min(avgActive / 1.5, 20)) + (sleep.total >= 7 ? 30 : sleep.total * 4)
    ));

    return { avgSteps, avgCal, avgDistance, avgActive, bestDay, goalPct, sleep, hrZones, vo2Max, score, sum, days };
  }, [fitnessData]);

  /* ── chart data ────────────────────────────────────────────────────── */
  const stepsChart = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(d => weekday(d.date)),
      datasets: [{
        label: 'Steps', data: fitnessData.daily.map(d => d.steps || 0),
        borderColor: PALETTE.indigo, backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 250);
          g.addColorStop(0, 'rgba(99,102,241,0.25)');
          g.addColorStop(1, 'rgba(99,102,241,0)');
          return g;
        },
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: PALETTE.indigo, pointBorderColor: '#fff', pointBorderWidth: 2
      }]
    };
  }, [fitnessData]);

  const calChart = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(d => weekday(d.date)),
      datasets: [{
        label: 'Calories', data: fitnessData.daily.map(d => d.calories || 0),
        backgroundColor: fitnessData.daily.map((_, i) =>
          i === fitnessData.daily.length - 1 ? PALETTE.rose : 'rgba(244,63,94,0.55)'
        ),
        borderRadius: 6, barThickness: 16
      }]
    };
  }, [fitnessData]);

  const distChart = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(d => weekday(d.date)),
      datasets: [{
        label: 'Distance (km)', data: fitnessData.daily.map(d => +(d.distance || 0).toFixed(2)),
        borderColor: PALETTE.teal, backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, 'rgba(20,184,166,0.25)');
          g.addColorStop(1, 'rgba(20,184,166,0)');
          return g;
        },
        fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: PALETTE.teal
      }]
    };
  }, [fitnessData]);

  const activeChart = useMemo(() => {
    if (!fitnessData?.daily) return null;
    return {
      labels: fitnessData.daily.map(d => weekday(d.date)),
      datasets: [{
        label: 'Active min', data: fitnessData.daily.map(d => d.activeMinutes || 0),
        backgroundColor: fitnessData.daily.map(d =>
          (d.activeMinutes || 0) >= 30 ? PALETTE.emerald : 'rgba(16,185,129,0.35)'
        ),
        borderRadius: 6, barThickness: 16
      }]
    };
  }, [fitnessData]);

  const sleepChart = useMemo(() => {
    if (!stats) return null;
    const { sleep } = stats;
    return {
      labels: ['Deep Sleep', 'REM Sleep', 'Light Sleep'],
      datasets: [{
        data: [sleep.deep, sleep.rem, sleep.light],
        backgroundColor: [PALETTE.violet, PALETTE.sky, 'rgba(139,92,246,0.25)'],
        borderWidth: 0, spacing: 3
      }]
    };
  }, [stats]);

  const hrChart = useMemo(() => {
    if (!stats) return null;
    const { hrZones } = stats;
    return {
      labels: ['Peak', 'Cardio', 'Fat Burn', 'Rest'],
      datasets: [{
        data: [hrZones.intense, hrZones.cardio, hrZones.fatBurn, hrZones.resting],
        backgroundColor: [PALETTE.rose, PALETTE.amber, PALETTE.emerald, PALETTE.sky],
        borderWidth: 0, spacing: 3
      }]
    };
  }, [stats]);

  const radarChart = useMemo(() => {
    if (!stats) return null;
    const { goalPct, avgActive, sleep, vo2Max, avgCal } = stats;
    return {
      labels: ['Steps Goal', 'Active Time', 'Sleep', 'VO₂ Max', 'Calorie Burn'],
      datasets: [{
        label: 'Fitness Score',
        data: [
          Math.min(goalPct, 100),
          Math.min((avgActive / 60) * 100, 100),
          Math.min((sleep.total / 9) * 100, 100),
          Math.min((vo2Max / 60) * 100, 100),
          Math.min((avgCal / 500) * 100, 100)
        ],
        backgroundColor: 'rgba(99,102,241,0.12)',
        borderColor: PALETTE.indigo, borderWidth: 2,
        pointBackgroundColor: PALETTE.indigo, pointRadius: 4
      }]
    };
  }, [stats]);

  /* ── AI insights ───────────────────────────────────────────────────── */
  const insights = useMemo(() => {
    if (!stats) return [];
    const { avgSteps, avgActive, sleep, vo2Max, goalPct } = stats;
    const list = [];
    if (goalPct >= 100) list.push({ icon: '🏆', text: 'You consistently hit 10,000 steps. Elite level!', type: 'success' });
    else if (goalPct >= 70) list.push({ icon: '📈', text: `You're at ${goalPct}% of your step goal. Add a short evening walk to close the gap.`, type: 'info' });
    else list.push({ icon: '⚠️', text: `Step count is at ${goalPct}% of goal. Try 2 short 15-min walks per day.`, type: 'warn' });

    if (sleep.total >= 7.5) list.push({ icon: '😴', text: 'Excellent sleep estimate. Consistent active days support deeper REM.', type: 'success' });
    else list.push({ icon: '🌙', text: 'Estimated sleep is below optimal. Reduce screen time 1h before bed.', type: 'warn' });

    if (avgActive >= 30) list.push({ icon: '💪', text: `${avgActive} avg active minutes exceeds the WHO daily minimum. Keep going!`, type: 'success' });
    else list.push({ icon: '🚶', text: 'Aim for at least 30 minutes of moderate activity daily.', type: 'info' });

    if (vo2Max >= 40) list.push({ icon: '🫁', text: `Estimated VO₂ max of ${vo2Max} ml/kg/min — above average cardiovascular fitness.`, type: 'success' });
    else list.push({ icon: '🏃', text: 'Boost VO₂ max with interval training (e.g., 1-min sprint / 2-min walk × 8).', type: 'info' });

    return list;
  }, [stats]);

  /* ─── connect handler ─────────────────────────────────────────────── */
  const connectGoogleFit = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/google-fit/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch { }
  };

  /* ─── shared chart opts ───────────────────────────────────────────── */
  const lineOpts = {
    ...baseChartOpts,
    scales: {
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } }
    }
  };
  const barOpts  = { ...lineOpts };
  const donutOpts = {
    ...baseChartOpts,
    plugins: { ...baseChartOpts.plugins, legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, padding: 14, boxWidth: 12 } } },
    cutout: '70%'
  };
  const radarOpts = {
    ...baseChartOpts,
    plugins: { ...baseChartOpts.plugins, legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true, max: 100,
        grid: { color: '#f3f4f6' },
        ticks: { display: false },
        pointLabels: { font: { size: 11 }, color: '#6b7280' }
      }
    }
  };

  /* ─── TABS ─────────────────────────────────────────────────────────── */
  const TABS = [
    { id: 'overview', label: 'Overview',   icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity',   icon: <Activity className="w-4 h-4"  /> },
    { id: 'sleep',    label: 'Sleep',      icon: <Moon className="w-4 h-4"      /> },
    { id: 'heart',    label: 'Heart',      icon: <Heart className="w-4 h-4"     /> },
    { id: 'insights', label: 'AI Insights',icon: <Brain className="w-4 h-4"     /> },
  ];

  /* ─── RENDER ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <img src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png" alt="Google Fit" className="w-5 h-5" />
          <span className="font-bold text-gray-900 text-sm">Fitness Analysis</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        </div>

        {/* date range */}
        {isConnected && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {['7','30','90'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  dateRange === r ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >{r}D</button>
            ))}
          </div>
        )}

        <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Not connected ───────────────────────────────────────────── */}
      {!isLoading && !isConnected && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Google_Fit_icon_%282018%29.svg/512px-Google_Fit_icon_%282018%29.svg.png" alt="" className="w-12 h-12 opacity-60 grayscale" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connect Google Fit</h2>
          <p className="text-gray-500 text-center max-w-sm">Link your Google Fit account for detailed sleep, heart rate, and activity analysis.</p>
          <button onClick={connectGoogleFit}
            className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all shadow-lg">
            Connect Now
          </button>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Syncing your fitness data…</p>
        </div>
      )}

      {/* ── Dashboard ───────────────────────────────────────────────── */}
      {!isLoading && isConnected && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ── HEALTH SCORE ────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
              {/* Score ring */}
              <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                {/* ring */}
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={
                      stats.score >= 80 ? PALETTE.emerald : stats.score >= 60 ? PALETTE.amber : PALETTE.rose
                    } strokeWidth="10"
                      strokeDasharray={`${(stats.score / 100) * 327} 327`}
                      strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-gray-900">{stats.score}</span>
                    <span className="text-xs text-gray-400 font-medium">Score</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {stats.score >= 80 ? 'Excellent' : stats.score >= 60 ? 'Good' : 'Needs Work'} Health Score
                  </h2>
                  <p className="text-sm text-gray-500">Based on your activity, sleep, and heart metrics over the last {dateRange} days.</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Steps Goal', val: `${stats.goalPct}%`, ok: stats.goalPct >= 80 },
                      { label: 'Sleep',      val: `${stats.sleep.total}h`, ok: stats.sleep.total >= 7 },
                      { label: 'VO₂ Max',   val: stats.vo2Max, ok: stats.vo2Max >= 40 },
                    ].map(({ label, val, ok }) => (
                      <div key={label} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                        {label}: {val}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 min-w-[180px]">
                {[
                  { icon: <Footprints className="w-4 h-4" />, label: 'Avg Steps',   val: fmt(stats.avgSteps),            color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { icon: <Flame className="w-4 h-4" />,      label: 'Avg Kcal',    val: fmt(stats.avgCal),              color: 'text-rose-600',   bg: 'bg-rose-50'   },
                  { icon: <MapPin className="w-4 h-4" />,     label: 'Avg Dist',    val: `${fmt(stats.avgDistance,1)} km`,color: 'text-teal-600',   bg: 'bg-teal-50'   },
                  { icon: <Activity className="w-4 h-4" />,   label: 'Avg Active',  val: `${stats.avgActive} min`,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
                ].map(({ icon, label, val, color, bg }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                    <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center`}>{icon}</div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TABS ────────────────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ════ OVERVIEW TAB ══════════════════════════════════════ */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Radar + Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Fitness Radar</h3>
                  <div className="h-[260px]">{radarChart && <Radar data={radarChart} options={radarOpts} />}</div>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Footprints className="w-4 h-4 text-indigo-500" /> Daily Steps</h3>
                    <span className="text-xs text-gray-400 font-medium">Goal: 10,000</span>
                  </div>
                  <div className="h-[260px]">{stepsChart && <Line data={stepsChart} options={lineOpts} />}</div>
                </div>
              </div>

              {/* Best day + Consistency */}
              {stats.bestDay && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white sm:col-span-1">
                    <Award className="w-6 h-6 mb-3 opacity-80" />
                    <p className="text-xs font-semibold opacity-70 mb-1">Best Day</p>
                    <p className="text-2xl font-black">{fmt(stats.bestDay.steps)} <span className="text-sm font-normal opacity-70">steps</span></p>
                    <p className="text-xs opacity-60 mt-1">{fmtDate(stats.bestDay.date)}</p>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:col-span-2 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">Period Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Total Steps',    val: fmt(stats.sum.steps) },
                        { label: 'Total Calories', val: `${fmt(stats.sum.calories)} kcal` },
                        { label: 'Total Distance', val: `${fmt(stats.sum.distance, 1)} km` },
                        { label: 'Total Active',   val: `${Math.floor(stats.sum.activeMinutes/60)}h ${stats.sum.activeMinutes%60}m` },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ ACTIVITY TAB ══════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-rose-500" /> Calories Burned</h3>
                  <div className="h-[240px]">{calChart && <Bar data={calChart} options={barOpts} />}</div>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-500" /> Distance (km)</h3>
                  <div className="h-[240px]">{distChart && <Line data={distChart} options={lineOpts} />}</div>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> Active Minutes</h3>
                  <p className="text-xs text-gray-400 mb-3">Green = reached 30-min WHO daily goal</p>
                  <div className="h-[200px]">{activeChart && <Bar data={activeChart} options={barOpts} />}</div>
                </div>
                {/* Activity streak heatmap */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Activity Heatmap</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {(fitnessData?.daily || []).slice(-Math.min(35, fitnessData?.daily?.length || 0)).map((d, i) => {
                      const intensity = Math.min(1, (d.steps || 0) / 12000);
                      const alpha = 0.1 + intensity * 0.9;
                      return (
                        <div key={i} title={`${fmtDate(d.date)}: ${fmt(d.steps)} steps`}
                          className="aspect-square rounded-md transition-all hover:scale-110 cursor-default"
                          style={{ backgroundColor: `rgba(99,102,241,${alpha.toFixed(2)})` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400">Less</span>
                    {[0.1,0.3,0.5,0.7,0.9].map(a => (
                      <div key={a} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(99,102,241,${a})` }} />
                    ))}
                    <span className="text-xs text-gray-400">More</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ SLEEP TAB ═════════════════════════════════════════ */}
          {activeTab === 'sleep' && stats && (
            <div className="space-y-6">
              {/* Sleep overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Moon className="w-4 h-4 text-violet-500" /> Sleep Breakdown</h3>
                  <p className="text-xs text-gray-400 mb-4">Estimated from your activity patterns</p>
                  <div className="h-[220px]">{sleepChart && <Doughnut data={sleepChart} options={donutOpts} />}</div>
                  <div className="mt-4 text-center">
                    <p className="text-3xl font-black text-gray-900">{stats.sleep.total}h</p>
                    <p className="text-xs text-gray-400 font-medium">Estimated nightly sleep</p>
                  </div>
                </div>

                {/* Sleep stages breakdown */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><BedDouble className="w-4 h-4 text-violet-500" /> Sleep Stages</h3>
                  {[
                    { label: 'Deep Sleep', hours: stats.sleep.deep, pct: Math.round((stats.sleep.deep / stats.sleep.total) * 100), color: PALETTE.violet, ideal: '20%', bg: 'bg-violet-100' },
                    { label: 'REM Sleep',  hours: stats.sleep.rem,  pct: Math.round((stats.sleep.rem  / stats.sleep.total) * 100), color: PALETTE.sky,    ideal: '25%', bg: 'bg-sky-100' },
                    { label: 'Light Sleep',hours: stats.sleep.light,pct: Math.round((stats.sleep.light/ stats.sleep.total) * 100), color: '#c4b5fd',      ideal: '55%', bg: 'bg-purple-50' },
                  ].map(({ label, hours, pct, color, ideal, bg }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <span className="text-xs text-gray-400">{hours}h · Ideal ≈ {ideal}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 rounded-2xl bg-violet-50 border border-violet-100">
                    <p className="text-xs font-semibold text-violet-700 mb-1">Sleep Quality Tip</p>
                    <p className="text-xs text-violet-600 leading-relaxed">
                      {stats.sleep.total >= 7.5
                        ? 'Your sleep pattern looks great. Maintain a fixed wake-up time to optimise circadian rhythm.'
                        : 'Consider going to bed 30 min earlier and avoiding caffeine after 2pm to improve sleep depth.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sleep cycle visualization */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Moon className="w-4 h-4 text-violet-500" /> Typical Nightly Cycle</h3>
                <div className="relative h-20">
                  {/* Sleep cycle lanes */}
                  {[
                    { label: 'Awake',  top: 0,  pct: 5,  color: '#fde68a' },
                    { label: 'Light',  top: 25, pct: 45, color: '#c4b5fd' },
                    { label: 'REM',    top: 50, pct: 25, color: PALETTE.sky },
                    { label: 'Deep',   top: 75, pct: 25, color: PALETTE.violet },
                  ].map(({ label, top, pct, color }) => (
                    <div key={label} className="absolute flex items-center gap-2" style={{ top: `${top}%` }}>
                      <span className="text-[10px] text-gray-400 w-12 shrink-0">{label}</span>
                      <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden relative">
                        <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-2 pl-14">
                  <span>10 PM</span><span>12 AM</span><span>2 AM</span><span>4 AM</span><span>6 AM</span>
                </div>
              </div>
            </div>
          )}

          {/* ════ HEART TAB ═════════════════════════════════════════ */}
          {activeTab === 'heart' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> Heart Rate Zones</h3>
                  <p className="text-xs text-gray-400 mb-4">Estimated from activity intensity patterns</p>
                  <div className="h-[220px]">{hrChart && <Doughnut data={hrChart} options={donutOpts} />}</div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Zone Details</h3>
                  {[
                    { z: 'Peak / Intense', mins: stats.hrZones.intense, bpm: '170–185', color: '#f43f5e', tip: 'Maximises VO₂ max' },
                    { z: 'Cardio',         mins: stats.hrZones.cardio,  bpm: '150–170', color: '#f59e0b', tip: 'Improves aerobic capacity' },
                    { z: 'Fat Burn',       mins: stats.hrZones.fatBurn, bpm: '120–150', color: '#10b981', tip: 'Optimal for fat oxidation' },
                    { z: 'Resting / Easy', mins: stats.hrZones.resting, bpm: '60–120',  color: '#0ea5e9', tip: 'Recovery & base fitness' },
                  ].map(({ z, mins, bpm, color, tip }) => (
                    <div key={z} className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-gray-800">{z}</span>
                          <span className="text-xs font-bold text-gray-900">{mins} min</span>
                        </div>
                        <p className="text-xs text-gray-400">{bpm} bpm · {tip}</p>
                      </div>
                    </div>
                  ))}

                  {/* VO2 max */}
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rose-700">Estimated VO₂ Max</p>
                        <p className="text-2xl font-black text-rose-600 mt-1">{stats.vo2Max} <span className="text-sm font-normal">ml/kg/min</span></p>
                      </div>
                      <Wind className="w-8 h-8 text-rose-300" />
                    </div>
                    <p className="text-xs text-rose-500 mt-2">
                      {stats.vo2Max >= 50 ? 'Excellent — elite-level cardio fitness' :
                       stats.vo2Max >= 40 ? 'Good — above average' :
                       stats.vo2Max >= 30 ? 'Average — room to improve' : 'Below average — build cardio base'}
                    </p>
                  </div>
                </div>
              </div>

              {/* resting HR estimate */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> Resting Heart Rate Estimate</h3>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-5xl font-black text-gray-900">
                      {Math.max(55, Math.round(75 - stats.vo2Max * 0.25))}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">bpm (estimated)</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { label: 'Athlete',  range: '40–60', ok: stats.vo2Max >= 50 },
                      { label: 'Fit',      range: '60–70', ok: stats.vo2Max >= 40 },
                      { label: 'Average',  range: '70–80', ok: stats.vo2Max >= 30 },
                      { label: 'High',     range: '80+',   ok: false },
                    ].map(({ label, range, ok }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                        <span className="text-xs text-gray-500">{label}:</span>
                        <span className="text-xs font-semibold text-gray-700">{range} bpm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ AI INSIGHTS TAB ═══════════════════════════════════ */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl text-white flex items-center gap-4">
                <Brain className="w-8 h-8 opacity-80 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">AI Health Insights</h3>
                  <p className="text-xs opacity-70">Personalized recommendations based on your {dateRange}-day fitness data</p>
                </div>
              </div>

              {insights.map(({ icon, text, type }, i) => (
                <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border ${
                  type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                  type === 'warn'    ? 'bg-amber-50 border-amber-100' :
                                       'bg-blue-50 border-blue-100'
                }`}>
                  <span className="text-2xl shrink-0">{icon}</span>
                  <p className={`text-sm font-medium leading-relaxed ${
                    type === 'success' ? 'text-emerald-800' :
                    type === 'warn'    ? 'text-amber-800' : 'text-blue-800'
                  }`}>{text}</p>
                </div>
              ))}

              {/* Weekly Plan */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Suggested Weekly Plan</h3>
                <div className="space-y-3">
                  {[
                    { day: 'Mon', activity: 'Brisk walk — 30 min', intensity: 'Low' },
                    { day: 'Tue', activity: 'Interval run — 20 min', intensity: 'High' },
                    { day: 'Wed', activity: 'Yoga / Stretch — 30 min', intensity: 'Low' },
                    { day: 'Thu', activity: 'Cycling / Swimming — 30 min', intensity: 'Moderate' },
                    { day: 'Fri', activity: 'Strength training — 40 min', intensity: 'High' },
                    { day: 'Sat', activity: 'Long walk / Hike — 60 min', intensity: 'Moderate' },
                    { day: 'Sun', activity: 'Active recovery / Rest', intensity: 'Rest' },
                  ].map(({ day, activity, intensity }) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-10 text-xs font-bold text-gray-400">{day}</span>
                      <div className="flex-1 text-sm text-gray-700">{activity}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        intensity === 'High'     ? 'bg-rose-50 text-rose-700' :
                        intensity === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                        intensity === 'Rest'     ? 'bg-gray-100 text-gray-500' :
                                                   'bg-emerald-50 text-emerald-700'
                      }`}>{intensity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hydration */}
              {stats && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Droplets className="w-4 h-4 text-sky-500" /> Estimated Hydration Need</h3>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-4xl font-black text-sky-600">
                        {(2 + stats.avgActive * 0.015 + stats.avgCal * 0.001).toFixed(1)}L
                      </p>
                      <p className="text-xs text-gray-400 mt-1">per day recommended</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-gray-600">Based on your average activity of {stats.avgActive} min and {fmt(stats.avgCal)} kcal burned.</p>
                      <p className="text-xs text-gray-400">Add 250ml extra for every 30 min of exercise.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FitnessAnalysis;