import express from 'express';
import { uploadPickerFile } from '../utils/handler';
import multer from 'multer';

const upload = multer(); // Use in-memory storage

const rawPickerRouter = express.Router();

// Route to handle picker file uploads
rawPickerRouter.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (file) {
        uploadPickerFile(file.buffer)
            .then(() => res.status(200).send('Picker file uploaded successfully'))
            .catch((err) => res.status(500).send(`Error uploading picker file: ${err.message}`));
    } else {
        res.status(400).send('No file uploaded');
    }
});

export { rawPickerRouter };
