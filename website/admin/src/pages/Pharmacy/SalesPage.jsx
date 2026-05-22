import React, { useState, useEffect, useContext, useRef } from "react";
import { PharmacyContext } from "../../context/PharmacyContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  DollarSign,
  Printer,
  Download,
  FileText,
  CheckCircle,
  X,
  PlusCircle,
  Calendar,
  Phone,
  MapPin,
  AlertCircle,
  Info,
  ShoppingBag,
  Clipboard,
  CreditCard as StripeIcon,
} from "react-feather";

// Receipt component for printing
const Receipt = React.forwardRef(({ sale, pharmacyInfo }, ref) => {
  if (!sale) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy hh:mm a");
  };

  return (
    <div ref={ref} className="p-6 bg-white w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{pharmacyInfo?.name || "Prescripto Pharmacy"}</h2>
        <p className="text-sm">{pharmacyInfo?.address || "123 Health Street, Medical District"}</p>
        <p className="text-sm">Phone: {pharmacyInfo?.phone || "(123) 456-7890"}</p>
        <p className="text-sm">Email: {pharmacyInfo?.email || "pharmacy@prescripto.com"}</p>
      </div>

      <div className="border-t border-b border-gray-300 py-2 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">Invoice #:</span>
          <span>{sale.invoice_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Date:</span>
          <span>{formatDate(sale.sold_at || new Date())}</span>
        </div>
        {sale.customer && sale.customer !== "Walk-in" && (
          <div className="flex justify-between">
            <span className="font-semibold">Patient:</span>
            <span>{typeof sale.customer === "string" ? sale.customer : sale.customer.name}</span>
          </div>
        )}
        {sale.doctor && (
          <div className="flex justify-between">
            <span className="font-semibold">Doctor:</span>
            <span>{sale.doctor}</span>
          </div>
        )}
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 text-sm">{item.medicine_name || item.name}</td>
              <td className="py-2 text-right text-sm">{item.quantity}</td>
              <td className="py-2 text-right text-sm">{item.price.toFixed(2)}</td>
              <td className="py-2 text-right text-sm">{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-4">
        <div className="flex justify-between py-1">
          <span className="font-semibold">Subtotal:</span>
          <span>{sale.currency || "₹"}{sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between py-1">
            <span className="font-semibold">Discount:</span>
            <span>{sale.currency || "₹"}{sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between py-1">
          <span className="font-semibold">GST (5%):</span>
          <span>{sale.currency || "₹"}{sale.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 text-lg font-bold">
          <span>Total:</span>
          <span>{sale.currency || "₹"}{sale.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">Payment Method:</span>
          <span>{sale.payment_method}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Payment Status:</span>
          <span>{sale.status}</span>
        </div>
      </div>

      <div className="text-center text-sm mt-8">
        <p>Thank you for your purchase!</p>
        <p className="mt-2">For returns and exchanges, please bring this receipt within 7 days.</p>
        <p className="mt-4">* This is a computer-generated receipt and does not require a signature *</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

// Modal component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-lg overflow-hidden`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

// Main SalesPage component
const SalesPage = () => {
  const { pToken, handle401Error, getProfileData, profileData } = useContext(PharmacyContext);
  const { currency, backendUrl } = useContext(AppContext);

  // Check authentication on component mount
  useEffect(() => {
    if (!pToken) {
      toast.error("Please login to access the sales page");
      setIsAuthenticated(false);
      return;
    }
    
    // Validate token format
    if (pToken && (!pToken.includes('.') || pToken.split('.').length !== 3)) {
      toast.error("Invalid authentication token. Please login again.");
      setIsAuthenticated(false);
      return;
    }
    
    setIsAuthenticated(true);
  }, [pToken]);

  // State for patient information
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    gender: "Male",
    contact: "",
    address: "",
    doctor: ""
  });

  // State for medicine cart and search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('prescripto-cart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (error) {
          console.error('Error parsing saved cart:', error);
          return [];
        }
      }
    }
    return [];
  });

  // State for payment and totals
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  
  // UI state
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Custom medicine modal
  const [showCustomMedicineModal, setShowCustomMedicineModal] = useState(false);
  const [customMedicine, setCustomMedicine] = useState({
    medicine_name: "",
    batch_no: `CUSTOM-${Math.floor(Math.random() * 10000)}`,
    price: "",
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    stock: 100,
    quantity: 1
  });

  // Refs
  const receiptRef = useRef();
  const searchInputRef = useRef();

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  // Effect to update cart in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prescripto-cart', JSON.stringify(cart));
    }
    
    // Calculate totals
    calculateTotals();
  }, [cart, discount, discountType]);

  // Calculate totals based on cart items and discount
  const calculateTotals = () => {
    const calculatedSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(calculatedSubtotal);

    let calculatedDiscount = 0;
    if (discountType === "amount") {
      calculatedDiscount = parseFloat(discount) || 0;
    } else {
      // Percentage discount
      const percentage = parseFloat(discount) || 0;
      calculatedDiscount = (calculatedSubtotal * percentage) / 100;
    }

    // Ensure discount doesn't exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);

    const afterDiscount = calculatedSubtotal - calculatedDiscount;
    const calculatedGst = afterDiscount * 0.05; // 5% GST
    
    setGst(calculatedGst);
    setTotal(afterDiscount + calculatedGst);
  };

  // Search for medicines
  const searchMedicines = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/pharmacy/medicines/search?search=${encodeURIComponent(searchTerm)}`,
        { headers: { pToken } }
      );

      if (data.success) {
        setSearchResults(data.data);
      } else {
        toast.error(data.message || "Failed to search medicines");
      }
    } catch (error) {
      console.error("Medicine search error:", error);
      if (!handle401Error(error)) {
        toast.error(error.response?.data?.message || "Failed to search medicines");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a new timeout
    window.searchTimeout = setTimeout(() => {
      searchMedicines();
    }, 500); // 500ms debounce
  };

  // Add medicine to cart
  const addToCart = (medicine, quantity = 1) => {
    // Check if medicine is already in cart
    const existingIndex = cart.findIndex(item => 
      item._id === medicine._id && !item.isCustom
    );

    if (existingIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].total = updatedCart[existingIndex].quantity * updatedCart[existingIndex].price;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, {
        _id: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: quantity,
        total: medicine.price * quantity,
        batch_no: medicine.batchNumber || 'N/A',
        expiry_date: medicine.expiry || new Date(),
        isCustom: false
      }]);
    }

    toast.success(`Added ${medicine.name} to cart`);
  };

  // Add custom medicine to cart
  const addCustomMedicineToCart = () => {
    // Validate custom medicine
    if (!customMedicine.medicine_name.trim()) {
      toast.error("Medicine name is required");
      return;
    }

    if (!customMedicine.price || isNaN(customMedicine.price) || parseFloat(customMedicine.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const price = parseFloat(customMedicine.price);
    const quantity = parseInt(customMedicine.quantity) || 1;

    // Add to cart
    setCart([...cart, {
      _id: `custom-${Date.now()}`,
      name: customMedicine.medicine_name,
      price: price,
      quantity: quantity,
      total: price * quantity,
      batch_no: customMedicine.batch_no,
      expiry_date: customMedicine.expiry_date,
      isCustom: true
    }]);

    // Reset and close modal
    setCustomMedicine({
      medicine_name: "",
      batch_no: `CUSTOM-${Math.floor(Math.random() * 10000)}`,
      price: "",
      expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      stock: 100,
      quantity: 1
    });
    setShowCustomMedicineModal(false);
    toast.success("Custom medicine added to cart");
  };

  // Update cart item quantity
  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].total = updatedCart[index].price * newQuantity;
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    toast.success("Item removed from cart");
  };

  // Handle patient info change
  const handlePatientInfoChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);
    const loadingToast = toast.loading("Initializing payment...");

    try {
      if (paymentMethod === "Cash") {
        await processCashPayment();
      } else if (paymentMethod === "Razorpay") {
        await processRazorpayPayment();
      } else if (paymentMethod === "Stripe") {
        await processStripePayment();
      }
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Payment processing error:", error);
      toast.error(error.message || "Payment processing failed. Please try again.");
      setProcessingPayment(false);
    }
  };

  // Process cash payment
  const processCashPayment = async () => {
    // Check if token exists
    if (!pToken) {
      toast.error("Authentication token missing. Please login again.");
      return;
    }

    const loadingToast = toast.loading("Processing cash payment...");
    try {
      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.isCustom ? null : item._id, // Send null ID for custom items
          quantity: item.quantity,
          isCustom: item.isCustom || false,
          custom_medicine: item.isCustom ? {
            medicine_name: item.name,
            price: item.price
          } : undefined
        })),
        discount: parseFloat(discount) || 0,
        discountType: discountType,
        gst,
        payment_method: "cash",
        customer: patientInfo.name.trim() ? patientInfo.name : "Walk-in",
        customer_details: {
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          contact: patientInfo.contact,
          address: patientInfo.address
        },
        note: patientInfo.doctor.trim() ? `Doctor: ${patientInfo.doctor}` : "",
        updateInventory: true 
      };

      const response = await axios.post(
        `${backendUrl}/api/payment/cash`,
        saleData,
        { 
          headers: { 
            pToken,
            'Content-Type': 'application/json'
          } 
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        const sale = response.data.data;
        setCurrentSale(sale);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        resetSale();
        toast.success("Cash payment recorded successfully!");
      } else {
        toast.error(response.data.message || "Failed to process cash payment");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Cash payment error:", error);
      if (!handle401Error(error)) {
        toast.error(error.response?.data?.message || "Cash payment failed. Check connection.");
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // Process Razorpay payment
  const processRazorpayPayment = async () => {
    // Check if token exists
    if (!pToken) {
      toast.error("Authentication token missing. Please login again.");
      return;
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.isCustom ? null : item._id,
          quantity: item.quantity,
          isCustom: item.isCustom || false,
          custom_medicine: item.isCustom ? {
            medicine_name: item.name,
            price: item.price
          } : undefined,
        })),
        discount: parseFloat(discount) || 0,
        discountType: discountType,
        gst,
        payment_method: "razorpay",
        customer: patientInfo.name.trim() ? patientInfo.name : "Walk-in",
        customer_details: {
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          contact: patientInfo.contact,
          address: patientInfo.address
        },
        note: patientInfo.doctor.trim() ? `Doctor: ${patientInfo.doctor}` : "",
        totalAmount: total,
        pharmacyId: profileData?._id || 'demo-pharmacy'
      };

      // Step 1: Create Order from your backend
      const { data: createOrderResponse } = await axios.post(
        `${backendUrl}/api/payment/razorpay/create-order`,
        saleData,
        { headers: { pToken } }
      );

      if (!createOrderResponse.success) {
        throw new Error(createOrderResponse.message || 'Failed to create payment order');
      }
      
      const orderData = createOrderResponse.data;

      // Use Vite environment variable prefix 'VITE_'
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error("Razorpay Key ID is not configured. Please contact administrator.");
        setProcessingPayment(false);
        return;
      }
      
      const options = {
        key: razorpayKey, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: profileData?.name || 'Prescripto Pharmacy',
        description: 'Medicine Purchase',
        order_id: orderData.id,
        handler: async function(response) {
          const verificationToast = toast.loading("Verifying payment...");
          // Step 2: Verify Payment with your backend
          try {
            const { data: verifyResponse } = await axios.post(
              `${backendUrl}/api/payment/razorpay/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { pToken } }
            );
          
            toast.dismiss(verificationToast);
            if (verifyResponse.success) {
              const sale = verifyResponse.data;
              setCurrentSale(sale);
              setShowPaymentModal(false);
              setShowSuccessModal(true);
              resetSale();
              toast.success("Payment successful!");
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (verifyError) {
            toast.dismiss(verificationToast);
            console.error("Payment verification error:", verifyError);
            toast.error(verifyError.response?.data?.message || "Payment verification failed.");
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: patientInfo.name,
          contact: patientInfo.contact,
          email: ""
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            // Only set processing to false if it's not already successful
            if (!showSuccessModal) {
              setProcessingPayment(false);
              toast.info('Payment cancelled');
            }
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK not loaded. Cannot process digital payment.');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error(error.response?.data?.message || error.message || 'Payment failed.');
      setProcessingPayment(false);
    }
  };

  // Process Stripe payment
  const processStripePayment = async () => {
    try {
      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.isCustom ? null : item._id,
          quantity: item.quantity,
          isCustom: item.isCustom || false,
          custom_medicine: item.isCustom ? {
            medicine_name: item.name,
            price: item.price
          } : undefined,
        })),
        discount: parseFloat(discount) || 0,
        discountType: discountType,
        gst,
        payment_method: "stripe",
        customer: patientInfo.name.trim() ? patientInfo.name : "Walk-in",
        customer_details: {
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          contact: patientInfo.contact,
          address: patientInfo.address
        },
        note: patientInfo.doctor.trim() ? `Doctor: ${patientInfo.doctor}` : "",
        totalAmount: total,
        pharmacyId: profileData?._id || 'demo-pharmacy',
        success_url: `${window.location.origin}/pharmacy/sales/success`,
        cancel_url: `${window.location.origin}/pharmacy/sales/cancel`
      };

      // Create Stripe checkout session
      const { data: sessionResponse } = await axios.post(
        `${backendUrl}/api/payment/stripe/create-session`,
        saleData,
        { headers: { pToken } }
      );

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Failed to create Stripe session');
      }
      
      // Redirect to Stripe checkout
      window.location.href = sessionResponse.data.url;
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(error.response?.data?.message || error.message || 'Stripe payment failed.');
      setProcessingPayment(false);
    }
  };

  // Generate PDF bill
  const generatePDF = () => {
    if (!currentSale) return;

    const doc = new jsPDF();
    
    // Add pharmacy info
    doc.setFontSize(18);
    doc.text(profileData?.name || "Prescripto Pharmacy", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(profileData?.address || "123 Health Street, Medical District", 105, 27, { align: "center" });
    doc.text(`Phone: ${profileData?.phone || "(123) 456-7890"}`, 105, 32, { align: "center" });
    
    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${currentSale.invoice_id}`, 14, 45);
    doc.text(`Date: ${format(new Date(currentSale.sold_at), "dd/MM/yyyy hh:mm a")}`, 14, 52);
    doc.text(`Patient: ${currentSale.customer}`, 14, 59);
    if (currentSale.doctor) {
      doc.text(`Doctor: ${currentSale.doctor}`, 14, 66);
    }
    
    // Add items table
    const tableColumn = ["Item", "Qty", "Price", "Total"];
    const tableRows = [];
    
    currentSale.items.forEach(item => {
      const itemData = [
        item.medicine_name || item.name,
        item.quantity,
        `${currency}${item.price.toFixed(2)}`,
        `${currency}${item.total.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentSale.doctor ? 72 : 65,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${currency}${currentSale.subtotal.toFixed(2)}`, 130, finalY);
    if (currentSale.discount > 0) {
      doc.text(`Discount: ${currency}${currentSale.discount.toFixed(2)}`, 130, finalY + 7);
    }
    doc.text(`GST (5%): ${currency}${currentSale.gst.toFixed(2)}`, 130, finalY + (currentSale.discount > 0 ? 14 : 7));
    doc.setFontSize(14);
    doc.text(`Total: ${currency}${currentSale.total_amount.toFixed(2)}`, 130, finalY + (currentSale.discount > 0 ? 24 : 17));
    
    // Add payment info
    doc.setFontSize(12);
    doc.text(`Payment Method: ${currentSale.payment_method}`, 14, finalY + 35);
    doc.text(`Payment Status: ${currentSale.status}`, 14, finalY + 42);
    
    // Add footer
    doc.setFontSize(10);
    doc.text("Thank you for your purchase!", 105, finalY + 55, { align: "center" });
    doc.text("For returns and exchanges, please bring this receipt within 7 days.", 105, finalY + 62, { align: "center" });
    doc.text("* This is a computer-generated receipt and does not require a signature *", 105, finalY + 72, { align: "center" });
    
    // Save the PDF
    doc.save(`Invoice-${currentSale.invoice_id}.pdf`);
  };

  // Reset sale after completion
  const resetSale = () => {
    setCart([]);
    setPatientInfo({
      name: "",
      age: "",
      gender: "Male",
      contact: "",
      address: "",
      doctor: ""
    });
    setDiscount(0);
    setDiscountType("amount");
    setPaymentMethod("Cash");
    setSearchTerm("");
    setSearchResults([]);
    setActiveStep(1);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('prescripto-cart');
    }
  };

  // Navigation between steps
  const goToNextStep = () => {
    if (activeStep === 1) {
      // Validate patient info if needed
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Validate cart
      if (cart.length === 0) {
        toast.error("Please add at least one medicine to the cart");
        return;
      }
      setActiveStep(3);
    } else if (activeStep === 3) {
      // Show payment modal
      setShowPaymentModal(true);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Render patient information form (Step 1)
  const renderPatientInfoForm = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-primary to-indigo-600 rounded-xl flex items-center justify-center mr-4">
          <User className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Information</h2>
          <p className="text-gray-600">Enter patient details for the prescription</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Patient Name</label>
          <input
            type="text"
            name="name"
            value={patientInfo.name}
            onChange={handlePatientInfoChange}
            placeholder="Enter patient name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Age</label>
          <input
            type="number"
            name="age"
            value={patientInfo.age}
            onChange={handlePatientInfoChange}
            placeholder="Enter age"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Gender</label>
          <select
            name="gender"
            value={patientInfo.gender}
            onChange={handlePatientInfoChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
          <input
            type="tel"
            name="contact"
            value={patientInfo.contact}
            onChange={handlePatientInfoChange}
            placeholder="Enter contact number"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Address</label>
          <textarea
            name="address"
            value={patientInfo.address}
            onChange={handlePatientInfoChange}
            placeholder="Enter address"
            rows="3"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
          ></textarea>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Doctor's Name (Optional)</label>
          <input
            type="text"
            name="doctor"
            value={patientInfo.doctor}
            onChange={handlePatientInfoChange}
            placeholder="Enter doctor's name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );

  // Render medicine selection (Step 2)
  const renderMedicineSelection = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
          <ShoppingBag className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Medicine Selection</h2>
          <p className="text-gray-600">Search and add medicines to the cart</p>
        </div>
      </div>
      
      {/* Search and add medicine */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search medicines by name, composition, or manufacturer..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-700"
              ref={searchInputRef}
            />
          </div>
          <button
            onClick={() => setShowCustomMedicineModal(true)}
            className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center shadow-lg shadow-green-200"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Custom
          </button>
        </div>

        {/* Search results */}
        {isSearching ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600 font-medium">Searching medicines...</p>
          </div>
        ) : searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 max-h-80 overflow-y-auto shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Search Results ({searchResults.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {searchResults.map((medicine) => (
                <div key={medicine._id} className="p-4 hover: #5f6FFF transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{medicine.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{medicine.composition}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-sm font-medium text-gray-700">{currency}{medicine.price.toFixed(2)}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          medicine.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : medicine.stock > 0 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {medicine.stock} in stock
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(medicine)}
                      disabled={medicine.stock <= 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        medicine.stock <= 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-primary text-white hover:bg-primary-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }`}
                    >
                      {medicine.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Clipboard className="text-white" size={16} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Medicine Cart</h3>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        {cart.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-2">Search and add medicines to your cart</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.isCustom ? "Custom Item" : `Batch: ${item.batch_no}`}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-600">Price: {currency}{item.price.toFixed(2)}</span>
                      <span className="text-sm font-medium text-gray-900">Total: {currency}{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                        className="p-2 rounded-l-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border-0 bg-transparent focus:outline-none text-sm font-medium"
                      />
                      <button
                        onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                        className="p-2 rounded-r-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render payment section (Step 3)
  const renderPaymentSection = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
          <CreditCard className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
          <p className="text-gray-600">Complete your order with secure payment</p>
        </div>
      </div>
      
      {/* Order summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-900">{currency}{subtotal.toFixed(2)}</span>
            </div>
          
            {/* Discount section */}
            <div className="py-3 border-t border-gray-200">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 font-medium">Discount</span>
                <span className="font-semibold text-gray-900">{currency}{(discountType === "amount" ? parseFloat(discount) || 0 : (subtotal * (parseFloat(discount) || 0) / 100)).toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-grow">
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={discountType === "amount" ? "Discount amount" : "Discount percentage"}
                  />
                </div>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="amount">Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between py-3 border-t border-gray-200">
              <span className="text-gray-600 font-medium">GST (5%)</span>
              <span className="font-semibold text-gray-900">{currency}{gst.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between py-4 text-xl font-bold border-t-2 border-gray-300 bg-white rounded-lg px-4">
              <span className="text-gray-800">Total Amount</span>
              <span className="text-blue-600">{currency}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment method selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setPaymentMethod("Cash")}
            className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              paymentMethod === "Cash" 
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100" 
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                paymentMethod === "Cash" ? "border-blue-500 bg-primary" : "border-gray-300"
              }`}>
                {paymentMethod === "Cash" && <div className="w-3 h-3 rounded-full bg-white"></div>}
              </div>
              <DollarSign className={`mr-3 ${paymentMethod === "Cash" ? "text-blue-600" : "text-gray-400"}`} size={24} />
              <span className={`text-lg font-semibold ${paymentMethod === "Cash" ? "text-primary-700" : "text-gray-700"}`}>Cash Payment</span>
            </div>
            <p className="text-sm text-gray-600 ml-12">Pay with cash on delivery</p>
          </div>
          
          <div
            onClick={() => isRazorpayConfigured && setPaymentMethod("Razorpay")}
            className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
              !isRazorpayConfigured 
                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" 
                : paymentMethod === "Razorpay" 
                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100 cursor-pointer" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer hover:shadow-lg"
            }`}
          >
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                paymentMethod === "Razorpay" ? "border-green-500 bg-green-500" : "border-gray-300"
              }`}>
                {paymentMethod === "Razorpay" && <div className="w-3 h-3 rounded-full bg-white"></div>}
              </div>
              <CreditCard className={`mr-3 ${paymentMethod === "Razorpay" ? "text-green-600" : "text-gray-400"}`} size={24} />
              <span className={`text-lg font-semibold ${paymentMethod === "Razorpay" ? "text-green-700" : "text-gray-700"}`}>Razorpay</span>
            </div>
            <p className="text-sm text-gray-600 ml-12">Pay with credit/debit card, UPI, etc.</p>
            {!isRazorpayConfigured && (
              <p className="text-xs text-red-500 ml-12 mt-1">Not configured</p>
            )}
          </div>
          
          <div
            onClick={() => isStripeConfigured && setPaymentMethod("Stripe")}
            className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
              !isStripeConfigured 
                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" 
                : paymentMethod === "Stripe" 
                  ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-100 cursor-pointer" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer hover:shadow-lg"
            }`}
          >
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                paymentMethod === "Stripe" ? "border-purple-500 bg-purple-500" : "border-gray-300"
              }`}>
                {paymentMethod === "Stripe" && <div className="w-3 h-3 rounded-full bg-white"></div>}
              </div>
              <StripeIcon className={`mr-3 ${paymentMethod === "Stripe" ? "text-purple-600" : "text-gray-400"}`} size={24} />
              <span className={`text-lg font-semibold ${paymentMethod === "Stripe" ? "text-purple-700" : "text-gray-700"}`}>Stripe</span>
            </div>
            <p className="text-sm text-gray-600 ml-12">Pay with international cards</p>
            {!isStripeConfigured && (
              <p className="text-xs text-red-500 ml-12 mt-1">Not configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Check if payment gateways are configured
  const isRazorpayConfigured = !!import.meta.env.VITE_RAZORPAY_KEY_ID;
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  // Show loading screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Checking Authentication</h2>
          <p className="text-gray-600">Please wait while we verify your session...</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Medicine Sales</h1>
          <p className="text-gray-600">Process patient orders and manage payments</p>
        </div>
      
        {/* Payment Gateway Status */}
        {(!isRazorpayConfigured || !isStripeConfigured) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Payment Gateway Configuration
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {!isRazorpayConfigured && "Razorpay not configured. "}
                  {!isStripeConfigured && "Stripe not configured. "}
                  Cash payments are always available.
                </p>
              </div>
            </div>
          </div>
        )}
      
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      activeStep >= step 
                        ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${activeStep >= step ? "text-gray-900" : "text-gray-500"}`}>
                      {step === 1 ? "Patient Details" : step === 2 ? "Medicine Selection" : "Payment"}
                    </p>
                  </div>
                </div>
                {step < 3 && (
                  <div
                    className={`absolute top-6 w-full h-0.5 transition-all duration-300 ${
                      activeStep > step ? "bg-gradient-to-r from-primary to-indigo-600" : "bg-gray-200"
                    }`}
                    style={{ left: "60%" }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      
      {/* Step content */}
      <div className="mb-6">
        {activeStep === 1 && renderPatientInfoForm()}
        {activeStep === 2 && renderMedicineSelection()}
        {activeStep === 3 && renderPaymentSection()}
      </div>
      
        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={goToPreviousStep}
            disabled={activeStep === 1}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeStep === 1 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
            }`}
          >
            ← Previous
          </button>
          <button
            onClick={goToNextStep}
            className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg shadow-blue-200"
          >
            {activeStep === 3 ? "Complete Payment →" : "Next →"}
          </button>
        </div>
      </div>
      
      {/* Custom medicine modal */}
      <Modal
        isOpen={showCustomMedicineModal}
        onClose={() => setShowCustomMedicineModal(false)}
        title="Add Custom Medicine"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
            <input
              type="text"
              value={customMedicine.medicine_name}
              onChange={(e) => setCustomMedicine({...customMedicine, medicine_name: e.target.value})}
              placeholder="Enter medicine name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={customMedicine.batch_no}
              onChange={(e) => setCustomMedicine({...customMedicine, batch_no: e.target.value})}
              placeholder="Enter batch number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                value={customMedicine.price}
                onChange={(e) => setCustomMedicine({...customMedicine, price: e.target.value})}
                placeholder="Enter price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={customMedicine.quantity}
                onChange={(e) => setCustomMedicine({...customMedicine, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                min="1"
                placeholder="Enter quantity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowCustomMedicineModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={addCustomMedicineToCart}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Payment confirmation modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Confirm Payment"
      >
        <div className="space-y-4">
          <div className=" #5f6FFF border border-primary-200 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Order Summary</h3>
                <p className="text-sm text-gray-500">Review your order before proceeding to payment</p>
              </div>
            </div>
          </div>
          
          {/* Order items list */}
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x {currency}{item.price.toFixed(2)}</p>
                </div>
                <p className="font-medium">{currency}{(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          {/* Order total */}
          <div className="border-t pt-4">
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>{currency}{total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Payment actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={processPayment}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={processingPayment}
            >
              {processingPayment ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          resetSale();
        }}
        title="Payment Successful!"
      >
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Processed Successfully</h3>
          <p className="text-sm text-gray-500 mb-6">
            Your order has been processed and the receipt has been generated.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                generatePDF();
                setShowSuccessModal(false);
                resetSale();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt for printing */}
      <div className="hidden">
        <Receipt ref={receiptRef} sale={currentSale} pharmacyInfo={profileData?.pharmacy} />
      </div>
    </div>
  );
};

export default SalesPage;