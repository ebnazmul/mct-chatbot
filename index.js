import express from "express";
import { config } from "dotenv";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";

config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

let retrievalChain;

async function initializeAI() {
  try {
    const embeddings = new OllamaEmbeddings({ model: "mistral:latest" });

    const vectorStore = await FaissStore.load("./data", embeddings);

    const llm = new Ollama({
      model: "mistral:latest",
      temperature: 0.2,
      maxRetries: 2,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`You are a MCT (Multimedia and Creative Technology) Departments assistant. Answer the following question **only** if you are confident based on the provided context.
Don't mention about the context in the answar.
If the context does not provide enough information to answer the question, respond with:
"I don't have the answer right now, we are increasing our knowledge base. Stay tuned."

<context>
{context}
</context>

Question: {input}`);

    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever: vectorStore.asRetriever(),
    });

    console.log("AI model initialized successfully!");
  } catch (error) {
    console.error("Error initializing AI:", error);
  }
}


app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const result = await retrievalChain.invoke({ input: question });
    res.json({ answer: result.answer });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


await initializeAI()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
