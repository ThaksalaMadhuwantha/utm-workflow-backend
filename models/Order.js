import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true
    },
    serviceType: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Half', 'Full'],
        default: 'Pending'
    },
    amount: {
        type: Number,
        required: true
    },
    assignedEmployee: {
        name: { type: String, default: '' },
        orderIndex: { type: Number, default: 0 }
    },
    employeePaid: {
        type: Boolean,
        default: false
    },
    orderStatus: {
        type: String,
        enum: ['Details OK', 'In Progress', 'Done', 'Revision'],
        default: 'Details OK'
    },
    designUpdates: [
        {
            updateText: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    postCompletionUpdates: [
        {
            updateText: String,
            hasServiceCharge: { type: Boolean, default: false },
            chargeAmount: { type: Number, default: 0 },
            isPaid: { type: Boolean, default: false },
            isCompleted: { type: Boolean, default: false }, // අලුතින් එකතු කළ Field එක
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;