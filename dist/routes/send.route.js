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
// src/routes/send.ts
const express_1 = __importDefault(require("express"));
const email_template_1 = require("../components/email-template");
const papaparse_1 = __importDefault(require("papaparse"));
const resend_1 = require("resend");
const sendRouter = express_1.default.Router();
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
sendRouter.post("/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { finalData } = req.body;
        if (!finalData) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const jsonData = typeof finalData === "string" ? JSON.parse(finalData) : finalData;
        const csvData = papaparse_1.default.unparse(jsonData);
        const emailHtml = (0, email_template_1.renderEmailTemplate)({ firstName: "Yoshi" });
        const response = yield resend.emails.send({
            from: "Acme <onboarding@yourdomain.com>",
            to: ["tranceyos2419@gmail.com"],
            subject: "Hi Yoshi✋! This is the Scraped data from your last upload",
            html: emailHtml,
            attachments: [
                {
                    filename: "final-data.csv",
                    content: Buffer.from(csvData).toString("base64"),
                    contentType: "text/csv",
                },
            ],
        });
        if (response.error) {
            return res.status(500).json({ error: response.error.message });
        }
        res.json({ message: "Email sent successfully" });
    }
    catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
}));
exports.default = sendRouter;
