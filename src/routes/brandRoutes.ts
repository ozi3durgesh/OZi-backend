import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createBrand, 
  getBrands, 
  getBrandById, 
  updateBrand, 
  deleteBrand 
} from '../controllers/brandController';

const router = Router();

// Apply authentication to all brand routes
router.use(authenticate);

// Brand routes
router.post('/', createBrand);
router.get('/', getBrands);
router.get('/:id', getBrandById);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
