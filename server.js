require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const FRONTEND_PATH = path.join(__dirname, "..", "frontend");

app.disable("x-powered-by");

app.use(express.json({ limit: "15kb" }));

// Serve frontend files
app.use(express.static(FRONTEND_PATH));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SentenceCraft AI backend is running!"
    });
});

// Generate sentence using Groq AI
app.post("/api/generate-sentence", async (req, res) => {
    try {
        const { keyword, context = "", style = "simple" } = req.body || {};

        // Validate keyword
        if (typeof keyword !== "string" || !keyword.trim()) {
            return res.status(400).json({
                success: false,
                error: "Please enter a word or idea."
            });
        }

        if (keyword.length > 120) {
            return res.status(400).json({
                success: false,
                error: "Keyword must be 120 characters or fewer."
            });
        }

        if (
            typeof context !== "string" ||
            context.length > 250
        ) {
            return res.status(400).json({
                success: false,
                error: "Context must be 250 characters or fewer."
            });
        }

        const allowedStyles = [
            "simple",
            "creative",
            "professional",
            "motivational",
            "question",
            "negative"
        ];

        if (!allowedStyles.includes(style)) {
            return res.status(400).json({
                success: false,
                error: "Please select a valid sentence style."
            });
        }

        if (!GROQ_API_KEY) {
            console.error("GROQ_API_KEY is missing.");

            return res.status(500).json({
                success: false,
                error: "AI service is not configured. Please check the backend environment."
            });
        }

        const styleInstructions = {
            simple: "Write one simple, clear, grammatically correct sentence.",
            creative: "Write one creative, vivid, engaging sentence.",
            professional: "Write one polished, professional sentence.",
            motivational: "Write one positive, inspiring motivational sentence.",
            question: "Write one natural, meaningful question sentence ending with a question mark.",
            negative: "Write one grammatically correct negative sentence."
        };

        const systemPrompt = `
You are SentenceCraft, an expert English writing assistant.

Your task is to create exactly ONE sentence using the user's keyword or idea.

Rules:
- Use correct English grammar and spelling.
- Follow the requested writing style.
- Use the additional context if supplied.
- Make the sentence meaningful and natural.
- Return only the sentence.
- Do not add explanations, headings, quotation marks, or bullet points.
- Do not claim that a sentence was AI-verified or guaranteed correct.
`;

        const userPrompt = `
Keyword or idea: ${keyword.trim()}

Writing style: ${style}

Style instructions: ${styleInstructions[style]}

Additional context: ${context.trim() || "None provided"}

Generate one sentence now.
`;

        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                })
            }
        );

        const responseData = await groqResponse.json();

        if (!groqResponse.ok) {
            console.error(
                "Groq API HTTP Status:",
                groqResponse.status
            );

            console.error(
                "Groq API error details:",
                JSON.stringify(responseData)
            );

            return res.status(502).json({
                success: false,
                error: "The AI service could not generate a sentence. Please try again."
            });
        }

        const sentence =
            responseData.choices?.[0]?.message?.content?.trim();

        if (!sentence) {
            return res.status(502).json({
                success: false,
                error: "The AI returned an empty sentence. Please try again."
            });
        }

        return res.json({
            success: true,
            sentence: sentence.replace(/^["']|["']$/g, ""),
            style,
            keyword: keyword.trim()
        });

    } catch (error) {
        console.error("Sentence generation error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Unable to generate a sentence. Check the server and internet connection."
        });
    }
});

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        error: "API endpoint not found."
    });
});

// Invalid JSON handler
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            success: false,
            error: "Invalid JSON request."
        });
    }

    next(error);
});

// Start server
app.listen(PORT, () => {
    console.log("---------------------------------------");
    console.log(" SentenceCraft AI backend is running!");
    console.log(` Website: http://localhost:${PORT}`);
    console.log(` Health:  http://localhost:${PORT}/api/health`);
    console.log("---------------------------------------");
});