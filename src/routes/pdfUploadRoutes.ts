import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PdfUploadController } from '../controllers/pdfUploadController';
import { S3Service } from '../services/s3Service';
import { ResponseHandler } from '../middleware/responseHandler';
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

// Multer configuration for brand image uploads (accepts any image format)
const brandImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept any image format
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any, false);
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

/**
 * @route POST /api/upload/brand-image
 * @desc Upload brand image to S3 and return URL
 * @access Private
 */
router.post('/brand-image', brandImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, 'No image file uploaded', 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname;
    const fileExtension = originalName.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${originalName}`;

    // Upload directly to S3 with custom method
    const s3Url = await S3Service.uploadBrandImage(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );

    return ResponseHandler.success(res, {
      message: 'Brand image uploaded successfully',
      data: {
        fileName: originalName,
        s3Url: s3Url,
        uploadedAt: new Date().toISOString(),
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    }, 200);

  } catch (error: any) {
    console.error('Error uploading brand image:', error);
    return ResponseHandler.error(res, error.message || 'Failed to upload brand image', 500);
  }
});

export default router;
