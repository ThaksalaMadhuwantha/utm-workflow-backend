import Order from '../models/Order.js';
import { GoogleGenAI } from '@google/genai';

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { serviceType, customerName, paymentStatus, amount, employeeName, orderStatus } = req.body;

        const count = await Order.countDocuments({ serviceType });
        const prefix = serviceType === 'CV' ? 'Cv' : serviceType === 'Flyer' ? 'Flyer' : 'Logo';
        const orderCode = `${prefix}_${count + 1}`;

        let assignedEmployee = { name: '', orderIndex: 0 };
        if (employeeName && employeeName.trim() !== '') {
            const trimmedEmpName = employeeName.trim();
            const empOrderCount = await Order.countDocuments({ 'assignedEmployee.name': trimmedEmpName });
            assignedEmployee = {
                name: trimmedEmpName,
                orderIndex: empOrderCount + 1
            };
        }

        const initialNote = `${orderCode} details ok - Paid (${paymentStatus})${assignedEmployee.name ? ` - Emp_${assignedEmployee.name}${assignedEmployee.orderIndex}` : ''}`;

        const newOrder = new Order({
            orderCode,
            serviceType,
            customerName,
            paymentStatus,
            amount,
            assignedEmployee,
            orderStatus,
            designUpdates: [{ updateText: initialNote }]
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, orderStatus, employeePaid, newUpdate, postUpdate, toggleUpdateId, toggleCompleteId } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (orderStatus) order.orderStatus = orderStatus;
        if (employeePaid !== undefined) order.employeePaid = employeePaid;
        
        if (newUpdate) {
            order.designUpdates.push({ updateText: newUpdate });
        }

        if (postUpdate) {
            if (!order.postCompletionUpdates) {
                order.postCompletionUpdates = [];
            }
            order.postCompletionUpdates.push({
                updateText: postUpdate.text,
                hasServiceCharge: Boolean(postUpdate.hasServiceCharge),
                chargeAmount: Number(postUpdate.chargeAmount || 0),
                isPaid: false,
                isCompleted: false
            });
        }

        // Toggle payment status of an update
        if (toggleUpdateId && order.postCompletionUpdates) {
            const updateItem = order.postCompletionUpdates.id(toggleUpdateId);
            if (updateItem && !updateItem.isCompleted) {
                updateItem.isPaid = !updateItem.isPaid;
            }
        }

        // Toggle completion status of an update
        if (toggleCompleteId && order.postCompletionUpdates) {
            const updateItem = order.postCompletionUpdates.id(toggleCompleteId);
            if (updateItem) {
                updateItem.isCompleted = !updateItem.isCompleted;
            }
        }

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Update Order Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// AI Smart Revision Analyzer Function (Initialized at runtime)
export const analyzeRevisionWithAI = async (req, res) => {
    try {
        const { customerText } = req.body;
        if (!customerText) {
            return res.status(400).json({ message: 'Customer text is required' });
        }

        // Initialize Gemini API here so it reads process.env.GEMINI_API_KEY at runtime
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `You are an AI assistant for a freelance design agency workflow system. 
Analyze the following customer message regarding a design revision/update: "${customerText}".
Determine if this requires a service charge. 
Return ONLY a valid JSON object with no markdown formatting:
{
  "updateText": "A clean, professional summary of the requested update",
  "hasServiceCharge": true or false,
  "chargeAmount": estimated LKR amount as a number (e.g. 300, 500, 0 if free)
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
        });

        const rawResult = response.text.trim();
        const cleanedJSON = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedJSON);

        res.status(200).json(parsedData);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({ message: 'AI analysis failed', error: error.message });
    }
};