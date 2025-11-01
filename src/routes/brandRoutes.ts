import { Router } from 'express';
import { authenticate, hasPermission } from '../middleware/auth';
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
router.post('/', hasPermission('brands-create'), createBrand);
router.get('/', hasPermission('brands-view'), getBrands);
router.get('/:id', hasPermission('brands-view'), getBrandById);
router.put('/:id', hasPermission('brands-create'), updateBrand);
router.delete('/:id', hasPermission('brands-create'), deleteBrand);

export default router;
