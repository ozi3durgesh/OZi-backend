import express from 'express';
import { uploadRiderFile } from '../utils/handler';
import multer from 'multer';

const upload = multer(); // Use in-memory storage

const rawRiderRouter = express.Router();

// Route to handle rider file uploads
rawRiderRouter.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (file) {
        uploadRiderFile(file.buffer)
            .then(() => res.status(200).send('Rider file uploaded successfully'))
            .catch((err) => res.status(500).send(`Error uploading rider file: ${err.message}`));
    } else {
        res.status(400).send('No file uploaded');
    }
});

export { rawRiderRouter };
