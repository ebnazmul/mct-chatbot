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
app.use(cors({ origin: ["https://mct-chatbot.vercel.app"] })); 
app.use(express.json());

let retrievalChain;

async function initializeAI() {
  try {
    console.log("Initializing AI components...");
    
    const embeddings = new OllamaEmbeddings({
      model: "mistral:latest"
    });
    const vectorStore = await FaissStore.load("./data/processed", embeddings);
    const llm = new Ollama({ model: "mistral:latest", temperature: 0.5 });

    // Define the prompt for the assistant
    const prompt = ChatPromptTemplate.fromTemplate(` 
      **Your Role**: Official AI for Daffodil International University's Multimedia & Creative Technology (MCT) program.
      
      ## INSTRUCTIONS:
      1. GREETINGS:
         - If input contains: hi/hello/hey/good [morning/afternoon]
         - Reply ONLY: "Hello! How can I help with MCT today?"
      
      2. MCT QUESTIONS (Faculty/Courses/Admissions):
         - Dont make too long answare strait to the point.
      
      3. OFF-TOPIC:
         - Reply: "I only handle MCT queries. Ask about admissions, courses, or careers."

      ## RESPONSE Example:
      - What is the amission helpline number?: "+8809617901212"
      
      ## CONTEXT:
      {context}
      
      ## QUESTION:
      {input}
        
      
      **Answer:**`);

    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever: vectorStore.asRetriever()
    });

    console.log("✅ AI initialization complete!");
  } catch (error) {
    console.error("Error during AI initialization:", error);
  }
}

app.post("/ask", async (req, res) => {
  if (!retrievalChain) {
    return res.status(500).json({
      error: "AI components are not initialized. Please try again later."
    });
  }

  const { question } = req.body;
  const startTime = Date.now();

  try {
    const result = await retrievalChain.invoke({ input: question.trim() });
    const responseTime = Date.now() - startTime;

    console.log(JSON.stringify(result), responseTime);

    res.status(200).json({
      answer: result.answer,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.log("Error processing question:", error);

    res.status(500).json({
      error: "Failed to process the request. Please check the server logs."
    });
  }
});

app.listen(PORT, () => {
  initializeAI();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});