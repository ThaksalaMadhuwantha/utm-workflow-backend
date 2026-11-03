import express from 'express';
import { 
    getOrders, 
    createOrder, 
    updateOrder, 
    deleteOrder, 
    analyzeRevisionWithAI 
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.post('/ai-analyze', analyzeRevisionWithAI);

export default router;