import * as express from "express" 
import { Request, Response } from 'express';
import  multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

const uploadRouter = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');

const upload = multer({ dest: uploadDir });

uploadRouter.post('/', upload.single('file'), async (req: Request, res: Response) => {
    const { file, body } = req;
    const { email, storeName } = body;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!email) {
        return res.status(400).json({ message: 'No email submitted' });
    }
    if (!storeName) {
        return res.status(400).json({ message: 'No store name submitted' });
    }

    const filePath = path.join(uploadDir, file.originalname);

    // Move the file to the correct location
    fs.renameSync(file.path, filePath);

    try {
        const url = 'http://localhost:3000/api/v1/scrape';
        const response = await axios.post(url, { filePath, email, storeName });

        if (response.status !== 200) {
            return res.status(500).json({ message: 'Failed to send file path, email, and store name' });
        }
        return res.json({ message: 'File path, email, and store name sent successfully' });
    } catch (error) {
        console.error('🔴 Failed to send the file path, email, and store name:', error);
        return res.status(500).json({ message: 'Failed to send the file path, email, and store name' });
    }
});

export default uploadRouter;
