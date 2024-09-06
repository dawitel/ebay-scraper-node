"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_route_1 = __importDefault(require("./routes/upload.route"));
const send_route_1 = __importDefault(require("./routes/send.route"));
const scrape_route_1 = __importDefault(require("./routes/scrape.route"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/v1/upload', upload_route_1.default);
app.use('/api/v1/send', send_route_1.default);
app.use('/api/v1/scrape', scrape_route_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
