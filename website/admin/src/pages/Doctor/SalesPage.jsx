
import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Pill, 
  CreditCard, 
  Download,
  Check,
  AlertCircle,
  X,
  Search,
  ShoppingCart,
  FileText,
  Loader2,
  Calendar,
  Phone,
  MapPin,
  IndianRupee,
  Save,
  Receipt
} from 'lucide-react';

// Mock contexts - replace with your actual contexts
const DoctorContext = React.createContext({
  dToken: 'mock-token',
  profileData: {
    name: 'Dr. Sarah Wilson',
    clinic_name: 'Prescripto Medical Center',
    address: '123 Health Street, Medical District',
    phone: '+91 98765 43210',
    email: 'info@prescripto.com',
    license: 'MED-2024-001'
  }
});

const AppContext = React.createContext({
  backendUrl: 'https://api.prescripto.com',
  currency: '₹',
  darkMode: false
});

// Main Sales Page Component
const ModernSalesPage = () => {
  const { dToken, profileData } = useContext(DoctorContext);
  const { backendUrl, currency = '₹', darkMode = false } = useContext(AppContext);
  
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Patient Information State
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contact: '',
    address: ''
  });
  
  // Medicine Cart State
  const [medicines, setMedicines] = useState([
    { id: 1, name: '', quantity: 1, price: 0, total: 0 }
  ]);
  
  // Payment & Billing State
  const [paymentMethod, setPaymentMethod] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saleData, setSaleData] = useState(null);
  
  // Form Validation State
  const [errors, setErrors] = useState({});
  
  // Calculate totals whenever medicines change
  useEffect(() => {
    const newSubtotal = medicines.reduce((sum, med) => sum + (med.total || 0), 0);
    const newTax = newSubtotal * 0.05; // 5% GST
    const discountAmount = (newSubtotal * discount) / 100;
    const newGrandTotal = newSubtotal + newTax - discountAmount;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setGrandTotal(Math.max(0, newGrandTotal));
  }, [medicines, discount]);

  // Validation Functions
  const validatePatientInfo = () => {
    const newErrors = {};
    
    if (!patientInfo.name.trim()) newErrors.name = 'Patient name is required';
    if (!patientInfo.age || patientInfo.age < 1 || patientInfo.age > 120) {
      newErrors.age = 'Valid age (1-120) is required';
    }
    if (!patientInfo.contact.trim()) newErrors.contact = 'Contact number is required';
    else if (!/^[0-9]{10}$/.test(patientInfo.contact.replace(/\D/g, ''))) {
      newErrors.contact = 'Valid 10-digit contact number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMedicines = () => {
    const newErrors = {};
    let isValid = true;
    
    medicines.forEach((med, index) => {
      if (!med.name.trim()) {
        newErrors[`medicine_${index}_name`] = 'Medicine name is required';
        isValid = false;
      }
      if (!med.price || med.price <= 0) {
        newErrors[`medicine_${index}_price`] = 'Valid price is required';
        isValid = false;
      }
      if (!med.quantity || med.quantity <= 0) {
        newErrors[`medicine_${index}_quantity`] = 'Valid quantity is required';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Patient Info Handlers
  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Medicine Handlers
  const addMedicine = () => {
    setMedicines(prev => [...prev, {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const removeMedicine = (id) => {
    if (medicines.length > 1) {
      setMedicines(prev => prev.filter(med => med.id !== id));
    } else {
      toast.error('At least one medicine is required');
    }
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        const updated = { ...med, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = (updated.quantity || 0) * (updated.price || 0);
        }
        return updated;
      }
      return med;
    }));
    
    // Clear errors for this field
    const errorKey = `medicine_${medicines.findIndex(m => m.id === id)}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Step Navigation
  const nextStep = () => {
    if (currentStep === 1 && !validatePatientInfo()) {
      toast.error('Please fill all required patient information');
      return;
    }
    if (currentStep === 2 && !validateMedicines()) {
      toast.error('Please fill all medicine details correctly');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Payment Processing
  const processPayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsLoading(true);
    
    try {
      if (paymentMethod === 'cash') {
        await processCashPayment();
      } else if (paymentMethod === 'razorpay') {
        await processRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processCashPayment = async () => {
    try {
      // Prepare sale data with inventory update flag
      const saleData = {
        patientInfo,
        medicines: cart.map(item => ({
          ...item,
          isCustom: item.isCustom || false
        })),
        totalAmount: grandTotal,
        paymentMethod: 'cash',
        doctorId: doctorData?.id || 'demo-doctor',
        updateInventory: true // Flag to update inventory immediately
      };

      // Call backend API to process cash payment and update inventory
      const response = await fetch('/api/payment/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dToken}` // Add the doctor token for authentication
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Failed to process cash payment');
      }

      // Save sale to database and update UI
      const sale = await saveSaleToDatabase('cash', 'completed');
      setSaleData(sale);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      toast.success('Cash payment recorded and inventory updated successfully!');
    } catch (error) {
      console.error('Cash payment error:', error);
      toast.error(error.message || 'Cash payment processing failed. Please try again.');
      setIsLoading(false);
    }
  };

  const processRazorpayPayment = async () => {
    try {
      // Prepare sale data for backend
      const saleData = {
        patientInfo,
        medicines: cart.map(item => ({
          ...item,
          isCustom: item.isCustom || false
        })),
        totalAmount: grandTotal,
        paymentMethod: 'razorpay',
        doctorId: doctorData?.id || 'demo-doctor'
      };

      // Call backend API to create Razorpay order
      const response = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dToken}` // Add the doctor token for authentication
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await response.json();
      
      // Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        name: profileData?.clinic_name || 'Prescripto Medical',
        description: 'Medicine Purchase',
        order_id: orderData.id,
        handler: async function(response) {
          // Verify payment with backend
          const verifyResponse = await fetch('/api/payment/razorpay/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'dToken': localStorage.getItem('dToken')
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }),
          });
          
          if (!verifyResponse.ok) {
            throw new Error('Payment verification failed');
          }
          
          const sale = await saveSaleToDatabase('razorpay', 'completed', response.razorpay_payment_id);
          setSaleData(sale);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
          toast.success('Payment successful!');
        },
        prefill: {
          name: patientInfo.name,
          contact: patientInfo.contact,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Initialize and open Razorpay
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for development/demo environment
        toast.error('Razorpay SDK not loaded. Please try again or use cash payment.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error(error.message || 'Payment processing failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Stripe payment method removed as requested

  // Save sale to database
  const saveSaleToDatabase = async (method, status, transactionId = null) => {
    const invoiceId = `INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const saleData = {
      invoice_id: invoiceId,
      patient: patientInfo,
      medicines: medicines.filter(med => med.name.trim()),
      subtotal,
      discount,
      tax,
      grand_total: grandTotal,
      payment_method: method,
      payment_status: status,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
      created_by: profileData?.name || 'Admin'
    };

    // In production, make API call to save data
    // const response = await fetch(`${backendUrl}/api/sales`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${dToken}`
    //   },
    //   body: JSON.stringify(saleData)
    // });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return saleData;
  };

  // PDF Generation
  const generatePDF = () => {
    if (!saleData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header Section
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(profileData?.clinic_name || 'Prescripto Medical', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${profileData?.address || 'Medical Center Address'}`, margin, 35);
    doc.text(`Phone: ${profileData?.phone || '+91 XXXXX XXXXX'}`, margin, 42);

    // Invoice details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${saleData.invoice_id}`, pageWidth - margin, 25, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${format(new Date(saleData.created_at), 'dd MMM yyyy')}`, pageWidth - margin, 32, { align: 'right' });
    doc.text(`Time: ${format(new Date(saleData.created_at), 'hh:mm a')}`, pageWidth - margin, 38, { align: 'right' });

    // Patient Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', margin, 70);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${saleData.patient.name}`, margin, 80);
    doc.text(`Age: ${saleData.patient.age}`, margin, 87);
    doc.text(`Gender: ${saleData.patient.gender}`, margin, 94);
    doc.text(`Contact: ${saleData.patient.contact}`, margin, 101);
    if (saleData.patient.address) {
      doc.text(`Address: ${saleData.patient.address}`, margin, 108);
    }

    // Medicine Table
    const tableStartY = saleData.patient.address ? 120 : 115;
    
    const tableColumn = ['Medicine Name', 'Qty', 'Price', 'Total'];
    const tableRows = saleData.medicines.map(med => [
      med.name,
      med.quantity.toString(),
      `${currency}${med.price.toFixed(2)}`,
      `${currency}${med.total.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      }
    });

    // Totals Section
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text(`Subtotal: ${currency}${saleData.subtotal.toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });
    doc.text(`Discount: ${currency}${((saleData.subtotal * saleData.discount) / 100).toFixed(2)}`, pageWidth - margin, finalY + 7, { align: 'right' });
    doc.text(`Tax (5%): ${currency}${saleData.tax.toFixed(2)}`, pageWidth - margin, finalY + 14, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Grand Total: ${currency}${saleData.grand_total.toFixed(2)}`, pageWidth - margin, finalY + 25, { align: 'right' });

    // Payment Information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Payment Method: ${saleData.payment_method.toUpperCase()}`, margin, finalY + 35);
    doc.text(`Payment Status: ${saleData.payment_status.toUpperCase()}`, margin, finalY + 42);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing our services!', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

    // Save PDF
    doc.save(`Invoice-${saleData.invoice_id}.pdf`);
    toast.success('Invoice downloaded successfully!');
  };

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setPatientInfo({ name: '', age: '', gender: 'Male', contact: '', address: '' });
    setMedicines([{ id: 1, name: '', quantity: 1, price: 0, total: 0 }]);
    setPaymentMethod('');
    setDiscount(0);
    setErrors({});
    setSaleData(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Receipt className="text-primary" size={32} />
                Medicine Sales
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete patient transactions and generate invoices
              </p>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all ${
                    currentStep >= step
                      ? 'bg-primary text-white'
                      : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step ? <Check size={20} /> : step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Patient Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}
            >
              <div className="flex items-center gap-3 mb-6">
                <User className="text-primary" size={24} />
                <h2 className="text-2xl font-semibold">Patient Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={patientInfo.name}
                    onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.name 
                        ? 'border-red-500' 
                        : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Enter patient name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Age *
                  </label>
                  <input
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.age 
                        ? 'border-red-500' 
                        : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Gender *
                  </label>
                  <select
                    value={patientInfo.gender}
                    onChange={(e) => handlePatientInfoChange('gender', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={patientInfo.contact}
                      onChange={(e) => handlePatientInfoChange('contact', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.contact 
                          ? 'border-red-500' 
                          : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                      placeholder="Enter contact number"
                    />
                  </div>
                  {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={patientInfo.address}
                      onChange={(e) => handlePatientInfoChange('address', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                      placeholder="Enter patient address (optional)"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium"
                >
                  Continue to Medicines
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Medicine Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Pill className="text-primary" size={24} />
                  <h2 className="text-2xl font-semibold">Medicine Information</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addMedicine}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> Add Medicine
                </motion.button>
              </div>

              <div className="space-y-6">
                {medicines.map((medicine, index) => (
                  <motion.div
                    key={medicine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 border rounded-lg ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Medicine {index + 1}</h3>
                      {medicines.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeMedicine(medicine.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={20} />
                        </motion.button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={medicine.name}
                          onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors[`medicine_${index}_name`] 
                              ? 'border-red-500' 
                              : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Enter medicine name"
                        />
                        {errors[`medicine_${index}_name`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`medicine_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Price per Unit *
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            value={medicine.price}
                            onChange={(e) => updateMedicine(medicine.id, 'price', parseFloat(e.target.value) || 0)}
                            className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors[`medicine_${index}_price`] 
                                ? 'border-red-500' 
                                : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                            }`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {errors[`medicine_${index}_price`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`medicine_${index}_price`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 p-4  #5f6FFF dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary-700 dark:text-blue-300">Total:</span>
                        <span className="text-lg font-bold text-primary-700 dark:text-blue-300 flex items-center">
                          <IndianRupee size={16} className="mr-1" />
                          {medicine.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Medicine Summary */}
              <div className={`mt-8 p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="flex items-center">
                      <IndianRupee size={16} className="mr-1" />
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount (%):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className={`w-20 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5% GST):</span>
                    <span className="flex items-center">
                      <IndianRupee size={16} className="mr-1" />
                      {tax.toFixed(2)}
                    </span>
                  </div>
                  <div className={`flex justify-between text-xl font-bold pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <span>Grand Total:</span>
                    <span className="flex items-center text-green-600">
                      <IndianRupee size={20} className="mr-1" />
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prevStep}
                  className={`px-8 py-3 border rounded-lg transition-all font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back to Patient Info
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium"
                >
                  Proceed to Payment
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}
            >
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="text-primary" size={24} />
                <h2 className="text-2xl font-semibold">Payment Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'cash', label: 'Cash Payment', icon: '💰', description: 'Direct cash transaction - Completes inventory immediately' },
                      { id: 'razorpay', label: 'Digital Payment', icon: '💳', description: 'Credit/Debit cards, UPI, Net Banking via Razorpay' }
                    ].map((method) => (
                      <motion.div
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'border-blue-500  #5f6FFF dark:bg-blue-900/20'
                            : darkMode 
                              ? 'border-gray-600 hover:border-gray-500' 
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <h4 className="font-medium">{method.label}</h4>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {method.description}
                              </p>
                            </div>
                          </div>
                          {paymentMethod === method.id && (
                            <Check className="text-primary" size={24} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                  <div className={`p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    {/* Patient Details */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Patient Details</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {patientInfo.name}</p>
                        <p><span className="font-medium">Age:</span> {patientInfo.age}</p>
                        <p><span className="font-medium">Contact:</span> {patientInfo.contact}</p>
                      </div>
                    </div>

                    {/* Medicine List */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Medicines</h4>
                      <div className="space-y-2 text-sm">
                        {medicines.filter(med => med.name.trim()).map((med, index) => (
                          <div key={med.id} className="flex justify-between">
                            <span>{med.name} × {med.quantity}</span>
                            <span className="flex items-center">
                              <IndianRupee size={12} className="mr-1" />
                              {med.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className={`pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'} space-y-2`}>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="flex items-center">
                          <IndianRupee size={12} className="mr-1" />
                          {subtotal.toFixed(2)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({discount}%):</span>
                          <span className="flex items-center">
                            - <IndianRupee size={12} className="mr-1" />
                            {((subtotal * discount) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Tax (5%):</span>
                        <span className="flex items-center">
                          <IndianRupee size={12} className="mr-1" />
                          {tax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span>Total:</span>
                        <span className="flex items-center text-green-600">
                          <IndianRupee size={16} className="mr-1" />
                          {grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prevStep}
                  className={`px-8 py-3 border rounded-lg transition-all font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back to Medicines
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentModal(true)}
                  disabled={!paymentMethod}
                  className={`px-8 py-3 rounded-lg transition-all font-medium flex items-center gap-2 ${
                    paymentMethod
                      ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-4 focus:ring-green-500/20'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <CreditCard size={20} />
                  Complete Payment
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md w-full shadow-2xl`}
            >
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <CreditCard className="text-primary" size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Confirm Payment</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  You are about to process a payment of{' '}
                  <span className="font-bold text-green-600 flex items-center justify-center mt-1">
                    <IndianRupee size={20} className="mr-1" />
                    {grandTotal.toFixed(2)}
                  </span>
                </p>
              </div>

              <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg mb-6`}>
                <div className="flex items-center justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isLoading}
                  className={`flex-1 px-6 py-3 border rounded-lg transition-all font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processPayment}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-500/20 transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Confirm Payment
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md w-full shadow-2xl text-center`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-24 h-24 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <Check className="text-green-500" size={48} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Transaction completed successfully
                </p>
                {saleData && (
                  <p className="text-sm font-mono text-blue-600 mb-6">
                    Invoice: {saleData.invoice_id}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={generatePDF}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Invoice
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowSuccessModal(false);
                    resetForm();
                  }}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-500/20 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  New Sale
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSuccessModal(false)}
                  className={`w-full px-6 py-3 border rounded-lg transition-all font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernSalesPage;