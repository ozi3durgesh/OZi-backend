import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PdfUploadController } from '../controllers/pdfUploadController';
import multer from 'multer';

const router = Router();

// Multer configuration for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed') as any, false);
    }
  }
});

// Apply authentication middleware
router.use(authenticate);

/**
 * @route POST /api/upload/pdf/vrf
 * @desc Upload PDF file to S3 and return URL
 * @access Private
 */
router.post('/pdf/vrf', upload.single('file'), PdfUploadController.uploadPdf);

export default router;
