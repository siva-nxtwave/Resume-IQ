require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

app.post("/analyze", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        let resumeText = "";
        
        try {
            const parser = new PDFParse({ data: dataBuffer });
            const pdfData = await parser.getText();
            resumeText = pdfData.text;
            
            if (!resumeText || resumeText.trim() === "") {
                throw new Error("No text content could be extracted from the PDF. It might be scanned or image-based.");
            }
        } catch (pdfError) {
            throw new Error(`PDF Parsing Error: ${pdfError.message}`);
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `You are an expert ATS Resume Analyzer. Analyze this resume text and output a response that strictly adheres to the requested JSON schema.\n\nResume Text:\n${resumeText}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        atsScore: { type: "NUMBER" },
                        jobMatch: { type: "NUMBER" }, 
                        suggestions: { type: "ARRAY", items: { type: "STRING" } }, 
                        missingSkills: { type: "ARRAY", items: { type: "STRING" } }, 
                        interviewQuestions: { type: "ARRAY", items: { type: "STRING" } }, 
                        oneClickImprovements: { type: "ARRAY", items: { type: "STRING" } } 
                    },
                    required: ["atsScore", "jobMatch", "suggestions", "missingSkills", "interviewQuestions", "oneClickImprovements"]
                }
            }
        });

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            result: JSON.parse(response.text)
        });

    } catch (err) {
        console.error("Gemini Analysis Error:", err);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Analysis Failed",
            error: err.message
        });
    }
});

app.get("/", (req, res) => {
    res.send("Backend is working!");
});

const PORT = 5050;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});