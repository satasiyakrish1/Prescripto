import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const CONTACT_EMAIL = 'admin@prescripto.com';

const Check = ({ dim }) => (
  <svg className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${dim ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

/* ─── paid plan order ─────────────────────────────────────────────────────── */
const PAID_ORDER = ['Starter', 'Pro', 'ProAnnual', 'Elite'];

/* ═══════════════════════════════════════════════════════════════════════════ */
const Verification = () => {
  const [allPlans, setAllPlans]                     = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedPlan, setSelectedPlan]             = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [paymentLoading, setPaymentLoading]         = useState(false);
  const [claiming, setClaiming]                     = useState(false);
  const [showConfirm, setShowConfirm]               = useState(false);
  const [showCoupon, setShowCoupon]                 = useState(false);
  const [couponCode, setCouponCode]                 = useState('');
  const [applyingCoupon, setApplyingCoupon]         = useState(false);
  const [couponInfo, setCouponInfo]                 = useState(null);

  const { backendUrl, token, userData } = useContext(AppContext);
  const navigate = useNavigate();

  /* fetch ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/verification/plans`);
        if (data.success) {
          setAllPlans(Object.entries(data.plans).map(([key, val]) => ({ id: key, ...val })));
        }
      } catch { toast.error('Could not load plans'); }
      finally { setLoading(false); }
    };
    const checkStatus = async () => {
      if (!token || !userData?._id) return;
      try {
        const { data } = await axios.get(`${backendUrl}/api/verification/status`, { headers: { token } });
        if (data.success) setVerificationStatus(data);
      } catch {}
    };
    fetchPlans();
    checkStatus();
  }, [backendUrl, token, userData]);

  /* derived lists ---------------------------------------------------------- */
  const freePlan  = allPlans.find(p => p.id === 'Free');
  const paidPlans = PAID_ORDER.map(id => allPlans.find(p => p.id === id)).filter(Boolean);

  /* coupon / total --------------------------------------------------------- */
  const totalPayable = useMemo(() => {
    if (!selectedPlan) return 0;
    return couponInfo?.valid ? (couponInfo.finalAmount ?? selectedPlan.price) : selectedPlan.price;
  }, [selectedPlan, couponInfo]);

  /* pick ------------------------------------------------------------------- */
  const pick = (plan) => {
    if (plan.price === 0) { claimFree(plan); return; }
    setSelectedPlan(plan); setCouponInfo(null); setCouponCode(''); setShowConfirm(true);
  };

  /* free activation -------------------------------------------------------- */
  const claimFree = async (plan) => {
    if (!token || !userData?._id) { toast.error('Please login first'); navigate('/login'); return; }
    setClaiming(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/verification/create-order`,
        { userId: userData._id, planType: plan.id, amount: 0, currency: 'INR' },
        { headers: { token } }
      );
      if (data.success && data.free) {
        toast.success('Free plan activated!');
        setVerificationStatus(data);
        setTimeout(() => navigate('/my-profile'), 1200);
      } else toast.error(data.message || 'Could not activate free plan');
    } catch { toast.error('Error activating free plan'); }
    finally { setClaiming(false); }
  };

  /* razorpay --------------------------------------------------------------- */
  const loadRazorpay = () => new Promise((res, rej) => {
    if (window.Razorpay) { res(); return; }
    const s = Object.assign(document.createElement('script'), {
      src: 'https://checkout.razorpay.com/v1/checkout.js', async: true,
      onload: res, onerror: () => rej(new Error('Razorpay load failed'))
    });
    document.head.appendChild(s);
  });

  const handlePayment = async () => {
    if (!selectedPlan || !token || !userData?._id) return;
    setPaymentLoading(true);
    try {
      await loadRazorpay();
      const { data } = await axios.post(
        `${backendUrl}/api/verification/create-order`,
        { userId: userData._id, planType: selectedPlan.id, amount: Math.round(totalPayable * 100), currency: 'INR', couponCode: couponInfo?.valid ? couponInfo.code : undefined },
        { headers: { token } }
      );
      if (!data?.success) { toast.error(data?.message || 'Order creation failed'); setPaymentLoading(false); return; }
      if (data.free) { toast.success('Verified!'); setVerificationStatus(data); setShowConfirm(false); setTimeout(() => navigate('/my-profile'), 1200); return; }

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key || !data.order?.id) { toast.error('Payment config error'); setPaymentLoading(false); return; }

      const rz = new window.Razorpay({
        key, amount: data.order.amount, currency: data.order.currency || 'INR',
        name: 'Prescripto', description: selectedPlan.name, order_id: data.order.id,
        handler: verifyPayment,
        prefill: { name: userData.name || '', email: userData.email || '' },
        theme: { color: '#111827' },
        modal: { ondismiss: () => setPaymentLoading(false) }
      });
      rz.on('payment.failed', () => { toast.error('Payment failed'); setPaymentLoading(false); });
      rz.open();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment error');
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (r) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/verification/verify-payment`,
        { razorpay_payment_id: r.razorpay_payment_id, razorpay_order_id: r.razorpay_order_id, razorpay_signature: r.razorpay_signature },
        { headers: { token } }
      );
      if (data.success) { toast.success('Verified!'); setVerificationStatus(data); setTimeout(() => navigate('/my-profile'), 2000); }
      else toast.error(data.message || 'Verification failed');
    } catch { toast.error('Error verifying payment'); }
    finally { setPaymentLoading(false); }
  };

  const applyCoupon = async () => {
    if (!couponCode || !selectedPlan) return;
    setApplyingCoupon(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/coupons/validate`,
        { code: couponCode.trim(), planId: selectedPlan.id, amount: selectedPlan.price },
        { headers: { token } }
      );
      if (data.success && data.valid) {
        setCouponInfo({ valid: true, code: data.code, discountType: data.discountType, discountValue: data.discountValue, finalAmount: data.finalAmount });
        toast.success('Coupon applied');
        setShowCoupon(false);
      } else { setCouponInfo(null); toast.error(data.message || 'Invalid coupon'); }
    } catch { toast.error('Failed to validate coupon'); }
    finally { setApplyingCoupon(false); }
  };

  /* ── already verified ──────────────────────────────────────────────────── */
  if (verificationStatus?.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-6">
            <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">You're verified</h2>
          <p className="text-sm text-gray-400 mb-8">
            {verificationStatus.verifiedPlan} · since {new Date(verificationStatus.verifiedAt).toLocaleDateString('en-IN')}
          </p>
          <button onClick={() => navigate('/my-profile')} className="text-sm font-medium underline underline-offset-4 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  /* ── main ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen py-16 px-4">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-3">
          Get verified
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
          A verified badge builds trust with doctors and the community.
          Start free — upgrade whenever you need more.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Free plan ─────────────────────────────────────────────────── */}
          {freePlan && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-5 bg-white dark:bg-gray-900">

              {/* Left — name + desc */}
              <div className="min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{freePlan.name}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
                    Forever
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[160px]">{freePlan.description}</p>
              </div>

              {/* Centre — features in 2-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                {(freePlan.features || []).map((f, i) => (
                  <span key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>

              {/* Right — CTA */}
              <div className="flex justify-end md:justify-start">
                <button
                  onClick={() => pick(freePlan)}
                  disabled={claiming}
                  className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {claiming ? 'Activating…' : 'Get started free'}
                </button>
              </div>
            </motion.div>
          )}


          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Paid plans</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* ── Paid plans grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {paidPlans.map((plan, i) => {
              const isSelected = selectedPlan?.id === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.05 }}
                  onClick={() => pick(plan)}
                  className={`relative flex flex-col p-5 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                >
                  {/* Popular pill */}
                  {plan.popular && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap
                      ${isSelected ? 'bg-white text-gray-900' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}>
                      Most popular
                    </span>
                  )}

                  {/* Savings badge */}
                  {plan.savingsBadge && (
                    <span className={`absolute top-3.5 right-3.5 text-[10px] font-medium px-2 py-0.5 rounded-full
                      ${isSelected ? 'bg-white/15 text-white/80 dark:bg-black/15 dark:text-black/70' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                      {plan.savingsBadge}
                    </span>
                  )}

                  {/* Name */}
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
                    {plan.name}
                  </p>

                  {/* Price */}
                  <p className={`text-3xl font-bold tracking-tight mb-0.5 ${isSelected ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                    ₹{plan.price}
                  </p>
                  <p className={`text-xs mb-4 ${isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>{plan.duration}</p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {(plan.features || []).map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <svg className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-xs leading-relaxed ${isSelected ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={e => { e.stopPropagation(); pick(plan); }}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors
                      ${isSelected
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {isSelected ? 'Selected' : 'Choose'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* ── Contact / Enterprise section ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-6 py-5">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Need a custom plan?</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                For hospitals, clinics, groups or bulk users — we can tailor pricing, features and onboarding to your needs.
              </p>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Custom Verification Plan Enquiry&body=Hi Prescripto team,%0D%0A%0D%0AI'm interested in a custom plan for:%0D%0A%0D%0AOrganisation / Type: %0D%0ANumber of users: %0D%0ARequirements: %0D%0A%0D%0AThank you.`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Contact us
            </a>
          </motion.div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-300 dark:text-gray-600 pt-2">
            Secure payment via Razorpay · Coupon codes accepted
          </p>
        </div>
      )}

      {/* ── Confirm modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={() => setShowConfirm(false)}>

            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl">

              <div className="p-6">
                {/* header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedPlan.duration}</p>
                  </div>
                  <button onClick={() => setShowConfirm(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* summary */}
                <div className="space-y-2 py-4 border-t border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Plan price</span>
                    <span className="text-gray-900 dark:text-white">₹{selectedPlan.price}</span>
                  </div>
                  {couponInfo?.valid && (
                    <div className="flex justify-between text-xs text-green-500">
                      <span>Discount ({couponInfo.code})</span>
                      <span>−{couponInfo.discountType === 'percent' ? `${couponInfo.discountValue}%` : `₹${couponInfo.discountValue}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">₹{totalPayable}</span>
                  </div>
                </div>

                {/* coupon */}
                <button onClick={() => setShowCoupon(v => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3 transition-colors block">
                  {couponInfo?.valid ? `✓ Coupon ${couponInfo.code} applied` : 'Add coupon code'}
                </button>

                <AnimatePresence>
                  {showCoupon && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                      <div className="flex gap-2">
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-xs outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors" />
                        <button onClick={applyCoupon} disabled={applyingCoupon || !couponCode}
                          className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium disabled:opacity-40">
                          {applyingCoupon ? '…' : 'Apply'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* actions */}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handlePayment} disabled={paymentLoading}
                    className="flex-1 py-2.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-40 transition-opacity">
                    {paymentLoading ? 'Processing…' : `Pay ₹${totalPayable}`}
                  </button>
                </div>

                <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-3">256-bit encryption · Powered by Razorpay</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Verification;
