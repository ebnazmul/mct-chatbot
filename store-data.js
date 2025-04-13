import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { config } from "dotenv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
config();

const splitter = new CharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 50
});

try {
  const loader = new TextLoader("./data/data.txt");
  const docs = await loader.load();
  const documents = await splitter.splitDocuments(docs);
  const embeddings = new OllamaEmbeddings({ model: "mistral:latest" });


  const vectorStore = await FaissStore.fromDocuments(
    [documents[0], documents[1]], 
    embeddings
  );

  await vectorStore.save("./data/processed");

  
  for (let i = 2; i < documents.length; i++) {
    await vectorStore.addDocuments([documents[i]]);
    await vectorStore.save("./data/processed");
    console.log('Saved', i);
  }

  console.log("All documents processed successfully");

} catch (error) {
  console.log("Error:", error);
}