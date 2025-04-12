import express from "express";
import { config } from "dotenv";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import cors from "cors";


config();

const app = express();
const PORT = process.env.PORT || 3004;


app.use(cors({
  origin: "*",
}));
app.use(express.json());


let retrievalChain;
let isAIInitialized = false;

async function initializeAI() {
  try {
    console.log("Initializing AI components...");

    const embeddings = new OllamaEmbeddings({
      model: "mistral:latest"
    });

    const vectorStore = await FaissStore.load("./data", embeddings);

    const llm = new Ollama({
      model: "mistral:latest",
      temperature: 0.1
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are the official MCT Department assistant at Daffodil International University.  
      
      **Strict Rules:**  
      1. **Greetings (e.g., "hi", "hey"):**  
         - Reply with *only*: "Hello! How can I help with MCT today?"  
         - Never add extra details.  
      
      2. **MCT Questions:**  
         - Answer **concisely** (1-2 sentences max) using ONLY the context.  
         - If answer isn’t in context, say:  
           "I don’t have that info, but the MCT department is updating our knowledge base."  
         - Never mention "context".  
      
      3. **Non-MCT Queries:**  
         - Reply: "I specialize in MCT-related questions. How can I assist you with the program?"  
      
      **Examples:**  
      - Input: "Hey" → "Hello! How can I help with MCT today?"  
      - Input: "Admission requirements?" → "Minimum SSC GPA 2.5 and HSC GPA 2.0. Pass the admission test."  
      - Input: "What’s the weather?" → "I specialize in MCT-related questions. How can I assist you?"  
      
      **Context:**  
      {context}  
      
      **Question:**  
      {input}  
      
      **Answer (strictly follow these rules):**`);

    console.log("Creating document chain...");
    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever: vectorStore.asRetriever(1)
    });

    isAIInitialized = true;
    console.log("✅ AI initialization complete!");
  } catch (error) {
    console.error("❌ Error initializing AI:", error);
    process.exit(1); // Exit if initialization fails
  }
}



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

    const result = await retrievalChain.invoke({
      input: question.trim()
    });

    console.log(JSON.stringify(result));

    res.json({
      answer: result.answer,
      metadata: {
        responseTime: `${100}ms`,
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


startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});