"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const uploadRouter = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, '../../uploads');
const upload = (0, multer_1.default)({ dest: uploadDir });
uploadRouter.post('/', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const filePath = path_1.default.join(uploadDir, file.originalname);
    // Move the file to the correct location
    fs_1.default.renameSync(file.path, filePath);
    try {
        const url = 'http://localhost:3000/api/v1/scrape';
        const response = yield axios_1.default.post(url, { filePath, email, storeName });
        if (response.status !== 200) {
            return res.status(500).json({ message: 'Failed to send file path, email, and store name' });
        }
        return res.json({ message: 'File path, email, and store name sent successfully' });
    }
    catch (error) {
        console.error('🔴 Failed to send the file path, email, and store name:', error);
        return res.status(500).json({ message: 'Failed to send the file path, email, and store name' });
    }
}));
exports.default = uploadRouter;
