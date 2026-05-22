import React, { useState, useEffect, useContext } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Plus, Minus, Search, ShoppingCart, User, Phone, Mail, CreditCard,
  Banknote, Smartphone, Globe, Trash2, Edit, Eye, RefreshCw, Download,
  CheckCircle, XCircle, Clock, AlertCircle, Package, Calculator,
  Receipt, Save, X, Loader2, Filter, Calendar, DollarSign
} from 'lucide-react'

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove, medicines }) => {
  const medicine = medicines.find(m => m._id === item.medicine_id)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600">Stock: {medicine?.quantity || 0}</p>
          <p className="text-sm font-medium text-green-600">${item.price} each</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.medicine_id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.medicine_id, item.quantity + 1)}
              disabled={item.quantity >= (medicine?.quantity || 0)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="font-semibold text-gray-900">${(item.quantity * item.price).toFixed(2)}</p>
          </div>
          
          <button
            onClick={() => onRemove(item.medicine_id)}
            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Medicine Search Component
const MedicineSearch = ({ medicines, onAddToCart, loading }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMedicines, setFilteredMedicines] = useState([])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = medicines.filter(medicine =>
        medicine.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMedicines(filtered.slice(0, 10)) // Limit to 10 results
    } else {
      setFilteredMedicines([])
    }
  }, [searchTerm, medicines])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {filteredMedicines.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filteredMedicines.map((medicine) => (
            <div
              key={medicine._id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                onAddToCart(medicine)
                setSearchTerm('')
                setFilteredMedicines([])
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{medicine.medicine_name}</h4>
                  <p className="text-sm text-gray-600">{medicine.category} • {medicine.manufacturer}</p>
                  <p className="text-sm text-green-600 font-medium">${medicine.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock: {medicine.quantity}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    medicine.quantity > 50 ? 'bg-green-100 text-green-800' :
                    medicine.quantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {medicine.quantity > 50 ? 'In Stock' : medicine.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Customer Form Component
const CustomerForm = ({ customer, setCustomer }) => {
  const [isWalkIn, setIsWalkIn] = useState(typeof customer === 'string')

  const handleToggle = () => {
    setIsWalkIn(!isWalkIn)
    if (!isWalkIn) {
      setCustomer('Walk-in')
    } else {
      setCustomer({ name: '', phone: '', email: '' })
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isWalkIn 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-blue-100 text-primary-700 hover:bg-blue-200'
          }`}
        >
          {isWalkIn ? 'Add Customer Details' : 'Walk-in Customer'}
        </button>
      </div>

      {isWalkIn ? (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <User className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">Walk-in Customer</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={customer.name || ''}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={customer.phone || ''}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={customer.email || ''}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email address"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Payment Summary Component
const PaymentSummary = ({ cart, discount, setDiscount, paymentMethod, setPaymentMethod, onCompleteSale, loading }) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const gst = subtotal * 0.18 // 18% GST
  const total = subtotal + gst - discount

  const paymentMethods = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'UPI', label: 'UPI', icon: Smartphone },
    { id: 'Card', label: 'Card', icon: CreditCard },
    { id: 'Netbanking', label: 'Net Banking', icon: Globe }
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Payment Summary
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>GST (18%)</span>
          <span>${gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Discount</span>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            min="0"
            max={subtotal}
            step="0.01"
          />
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
        <div className="grid grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  paymentMethod === method.id
                    ? 'border-blue-500  #5f6FFF text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onCompleteSale}
        disabled={cart.length === 0 || !paymentMethod || loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Complete Sale
          </>
        )}
      </button>
    </div>
  )
}

// Main Complete Sales Page Component
const CompleteSalesPage = () => {
  const { pToken, handle401Error } = useContext(PharmacyContext)
  const { backendUrl, currency } = useContext(AppContext)

  // State management
  const [medicines, setMedicines] = useState([])
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState('Walk-in')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState({
    medicines: true,
    sale: false
  })

  // Fetch medicines
  const fetchMedicines = async () => {
    try {
      setLoading(prev => ({ ...prev, medicines: true }))
      const response = await axios.get(`${backendUrl}/api/medicine/list`, {
        headers: { pToken }
      })

      if (response.data.success) {
        setMedicines(response.data.medicines || [])
      } else {
        toast.error('Failed to fetch medicines')
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
      if (!handle401Error(error)) {
        toast.error('Error fetching medicines')
      }
    } finally {
      setLoading(prev => ({ ...prev, medicines: false }))
    }
  }

  useEffect(() => {
    if (pToken) {
      fetchMedicines()
    }
  }, [pToken])

  // Cart management
  const addToCart = (medicine) => {
    const existingItem = cart.find(item => item.medicine_id === medicine._id)
    
    if (existingItem) {
      if (existingItem.quantity < medicine.quantity) {
        updateCartQuantity(medicine._id, existingItem.quantity + 1)
      } else {
        toast.error('Cannot add more than available stock')
      }
    } else {
      if (medicine.quantity > 0) {
        setCart(prev => [...prev, {
          medicine_id: medicine._id,
          name: medicine.medicine_name,
          quantity: 1,
          price: medicine.price
        }])
        toast.success(`${medicine.medicine_name} added to cart`)
      } else {
        toast.error('Medicine is out of stock')
      }
    }
  }

  const updateCartQuantity = (medicineId, newQuantity) => {
    const medicine = medicines.find(m => m._id === medicineId)
    if (newQuantity > medicine.quantity) {
      toast.error('Cannot exceed available stock')
      return
    }

    setCart(prev => prev.map(item =>
      item.medicine_id === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (medicineId) => {
    setCart(prev => prev.filter(item => item.medicine_id !== medicineId))
    toast.success('Item removed from cart')
  }

  const clearCart = () => {
    setCart([])
    setCustomer('Walk-in')
    setDiscount(0)
    setPaymentMethod('')
    setNote('')
    toast.success('Cart cleared')
  }

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    try {
      setLoading(prev => ({ ...prev, sale: true }))

      const saleData = {
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          price: item.price
        })),
        customer,
        payment_method: paymentMethod,
        discount,
        note
      }

      const response = await axios.post(`${backendUrl}/api/pharmacy/sales/create`, saleData, {
        headers: { pToken }
      })

      if (response.data.success) {
        toast.success(`Sale completed! Invoice: ${response.data.data.invoice_id}`)
        
        // Clear cart and reset form
        clearCart()
        
        // Refresh medicines to update stock
        fetchMedicines()
        
        // Show invoice details
        console.log('Sale completed:', response.data.data)
      } else {
        toast.error(response.data.message || 'Failed to complete sale')
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      if (!handle401Error(error)) {
        toast.error(error.response?.data?.message || 'Error completing sale')
      }
    } finally {
      setLoading(prev => ({ ...prev, sale: false }))
    }
  }

  if (!pToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Please login to access the sales system</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
            <p className="text-gray-600">Complete medicine sales with inventory management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
            <button
              onClick={fetchMedicines}
              className="bg-blue-100 text-primary-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Medicine Search and Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Medicine Search */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Medicines
              </h3>
              <MedicineSearch
                medicines={medicines}
                onAddToCart={addToCart}
                loading={loading.medicines}
              />
            </div>

            {/* Shopping Cart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shopping Cart ({cart.length} items)
                </h3>
                {cart.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Total: ${cart.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Search and add medicines to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <CartItem
                        key={item.medicine_id}
                        item={item}
                        onUpdateQuantity={updateCartQuantity}
                        onRemove={removeFromCart}
                        medicines={medicines}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <CustomerForm customer={customer} setCustomer={setCustomer} />
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-6">
            <PaymentSummary
              cart={cart}
              discount={discount}
              setDiscount={setDiscount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onCompleteSale={completeSale}
              loading={loading.sale}
            />

            {/* Additional Notes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any special instructions or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompleteSalesPage
