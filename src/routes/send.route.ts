// src/routes/send.ts
import * as express from "express"
import { Request, Response } from "express";
import { renderEmailTemplate } from "../components/email-template"
import * as Papa from "papaparse";
import { Resend } from "resend";

const sendRouter = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);


sendRouter.post("/send", async (req: Request, res: Response) => {
    try {
        const { finalData } = req.body;

        if (!finalData) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const jsonData = typeof finalData === "string" ? JSON.parse(finalData) : finalData;
        const csvData = Papa.unparse(jsonData);

        const emailHtml = renderEmailTemplate({ firstName: "Yoshi" });

        const response = await resend.emails.send({
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
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

export default sendRouter;
