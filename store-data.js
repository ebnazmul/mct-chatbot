import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Optimized splitter for raw facts
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 150,  // Small chunks for individual facts
  chunkOverlap: 20,
  separators: ["\n", "  "],  // Split by newlines or double spaces
  keepSeparator: false
});

async function createVectorStore() {
  try {
    // 1. Load raw data
    const loader = new TextLoader("./data/data.txt");
    const docs = await loader.load();
    
    // 2. Split into fact-based chunks
    const chunks = await splitter.splitDocuments(docs);
    console.log(`Created ${chunks.length} fact chunks`);
    
    // 3. Create embeddings
    const embeddings = new OllamaEmbeddings({
      model: "mistral:latest",
      requestOptions: { timeout: 30000 }
    });
    
    // 4. Create and save store
    const vectorStore = await FaissStore.fromDocuments(chunks, embeddings);
    await vectorStore.save("./data");
    console.log(`✅ Stored ${vectorStore.index.ntotal} facts`);
    console.log("Sample chunks:", chunks.slice(0, 3).map(c => c.pageContent));
    
  } catch (err) {
    console.error("❌ Storage error:", err.message);
    process.exit(1);
  }
}

createVectorStore();