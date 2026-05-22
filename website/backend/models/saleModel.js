import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: false // Allow null for custom medicines
    },
    medicine_name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    isCustom: {
        type: Boolean,
        default: false
    }
});

const saleSchema = new mongoose.Schema({
    invoice_id: {
        type: String,
        required: true,
        unique: true
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['cash', 'razorpay', 'stripe', 'upi', 'card', 'netbanking'],
        required: true
    },
    payment_gateway: {
        type: String,
        enum: ['razorpay', 'stripe', null],
        default: null
    },
    payment_details: {
        method: String,
        gateway: String,
        order_id: String,
        payment_id: String,
        session_id: String,
        transaction_id: String,
        amount: Number,
        currency: String,
        completed_at: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled', 'Failed'],
        default: 'Completed'
    },
    customer: {
        type: mongoose.Schema.Types.Mixed,
        default: 'Walk-in',
        // Can be a string ('Walk-in') or an object with customer details
        // { name: String, phone: String, email: String }
    },
    note: {
        type: String,
        default: ''
    },
    sold_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true
    },
    sold_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate a unique invoice ID before saving
saleSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of sales for today to generate a sequential number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    try {
        const count = await this.constructor.countDocuments({
            sold_at: { $gte: todayStart, $lte: todayEnd }
        });
        
        // Format: INV-YYMMDD-XXXX (XXXX is a sequential number padded to 4 digits)
        this.invoice_id = `INV-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
        next();
    } catch (error) {
        next(error);
    }
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;