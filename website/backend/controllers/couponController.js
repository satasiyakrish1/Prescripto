import Coupon from '../models/couponModel.js';

const calcFinalAmount = (amount, coupon) => {
  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, amount);
  const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);
  return { discount, finalAmount };
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minAmount,
      expiresAt,
      usageLimit,
      allowedPlans
    } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      maxDiscount: maxDiscount ?? null,
      minAmount: minAmount ?? 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit ?? null,
      allowedPlans: Array.isArray(allowedPlans) ? allowedPlans : [],
      createdBy: req.admin?.id
    });
    res.json({ success: true, data: coupon });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const toggleCouponActive = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    coupon.active = !coupon.active;
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, planId, amount } = req.body;
    if (!code) return res.json({ success: false, message: 'Code is required' });
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon || !coupon.active) {
      return res.json({ success: true, valid: false, message: 'Invalid coupon' });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.json({ success: true, valid: false, message: 'Coupon expired' });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ success: true, valid: false, message: 'Coupon usage limit reached' });
    }
    if (coupon.allowedPlans?.length && planId && !coupon.allowedPlans.includes(planId)) {
      return res.json({ success: true, valid: false, message: 'Coupon not applicable for this plan' });
    }
    const baseAmount = typeof amount === 'number' ? amount : undefined;
    const computedAmount = baseAmount ?? null;
    if (computedAmount !== null && coupon.minAmount && computedAmount < coupon.minAmount) {
      return res.json({ success: true, valid: false, message: `Minimum amount ₹${coupon.minAmount}` });
    }
    const effectiveAmount = computedAmount ?? 0;
    const { discount, finalAmount } = calcFinalAmount(effectiveAmount, coupon);
    res.json({
      success: true,
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalAmount
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const markCouponUsed = async (code) => {
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return;
    coupon.usageCount += 1;
    await coupon.save();
  } catch {}
};
