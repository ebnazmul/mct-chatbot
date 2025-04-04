import express from "express";
import { config } from "dotenv";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3004;

// Security and middleware setup
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json());

// AI components
let retrievalChain;
let isAIInitialized = false;

async function initializeAI() {
  try {
    console.log("Initializing AI components...");

    const embeddings = new OllamaEmbeddings({
      model: "mistral:latest",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      requestOptions: {
        timeout: 30000 // 30 seconds timeout
      }
    });

    console.log("Loading vector store...");
    const vectorStore = await FaissStore.load("./data", embeddings);

    const llm = new Ollama({
      model: "mistral:latest",
      temperature: 0.2,
      maxRetries: 3,
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are the official assistant for the MCT (Multimedia and Creative Technology) Department at Daffodil International University.
      Your role is to provide accurate, professional answers to questions about the MCT program.
      
      **Strict Guidelines:**
      1. Answer ONLY based on the knowledge provided in the context below
      2. NEVER mention "context" or reference it in any way
      3. If the question cannot be answered from the context, respond: 
         "I don't have that information currently, but the MCT department is continuously updating our knowledge base."
      4. Always maintain a professional, helpful tone
      5. Keep answers concise yet informative
      6. Format responses for easy reading with proper spacing
      7. Focus strictly on MCT-related information
      
      **Example of good response:**
      Question: "What courses are offered in the MCT program?"
      Answer: "The MCT program offers courses in digital media production, graphic design, animation, web technologies, and multimedia programming. Core courses include..."
      
      **Context:**
      {context}
      
      **Question:**
      {input}
      
      **Answer (strictly follow guidelines):**`);

    console.log("Creating document chain...");
    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever: vectorStore.asRetriever(3), // Retrieve top 3 relevant documents
    });

    isAIInitialized = true;
    console.log("✅ AI initialization complete!");
  } catch (error) {
    console.error("❌ Error initializing AI:", error);
    process.exit(1); // Exit if initialization fails
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    aiInitialized: isAIInitialized,
    timestamp: new Date().toISOString()
  });
});

// Question endpoint
app.post("/ask", async (req, res) => {
  if (!isAIInitialized) {
    return res.status(503).json({
      error: "Service unavailable",
      message: "AI components are still initializing"
    });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Question must be a non-empty string"
    });
  }

  try {
    console.log(`Processing question: "${question}"`);
    const startTime = Date.now();

    const result = await retrievalChain.invoke({
      input: question.trim()
    });

    const responseTime = Date.now() - startTime;
    console.log(`Answered in ${responseTime}ms`);

    res.json({
      answer: result.answer,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: "Processing error",
      message: "An error occurred while processing your question"
    });
  }
});

// Initialize and start server
async function startServer() {
  await initializeAI();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Ollama endpoint: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
  });
}

// Handle shutdown gracefully
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});