import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

interface ChatMessage {
  q: string;
  a: string;
  id: number;
}

function App() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function handleChat(text: string) {
    if (!text.trim()) return;

    setIsSending(true);
    const userMessage = text;
    setChatText(""); // Clear input immediately after submission

    const newId = chat.length > 0 ? Math.max(...chat.map(c => c.id)) + 1 : 1;
    
    // Add user message and temporary bot response
    setChat(prev => [...prev, { q: userMessage, a: "Thinking...", id: newId }]);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ask`,
        { question: userMessage }
      );

      setChat(prev => 
        prev.map(msg => 
          msg.id === newId 
            ? { ...msg, a: response.data.answer } 
            : msg
        )
      );
    } catch (error) {
      setChat(prev => 
        prev.map(msg => 
          msg.id === newId 
            ? { ...msg, a: "Sorry, I couldn't process your request." } 
            : msg
        )
      );
      console.error("API call failed:", error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-sky-200 min-h-screen w-full flex flex-col justify-between">
      <div className="flex justify-center items-center mt-14 px-4">
        <div className="w-full max-w-2xl">
          {chat.length ? (
            <div className="overflow-y-auto max-h-[70vh] mb-4 pr-2">
              {chat.map((message) => (
                <div key={message.id} className="mb-4">
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3 mb-2 bg-gray-400/40 px-4 py-3 rounded-lg"
                  >
                    <div className="size-8 bg-red-500 rounded-full flex-shrink-0" />
                    <p className="text-gray-800">{message.q}</p>
                  </motion.div>

                  {/* Bot response */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={`flex items-start gap-3 bg-white/60 px-4 py-3 rounded-lg ${
                      message.a === "Thinking..." && "animate-pulse"
                    }`}
                  >
                    <div className="size-8 bg-blue-500 rounded-full flex-shrink-0" />
                    <p className="text-gray-800">{message.a}</p>
                  </motion.div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center mb-8">
              <motion.div className="flex justify-center">
              <img className="h-48" src="./mct-ai.png" alt="" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl mb-2 font-bold text-gray-800"
              >
                Hi, I'm MCT-Chatbot 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-700"
              >
                Ask me anything about MCT (Multimedia and Creative Technology)
                department of Daffodil International University.
              </motion.p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleChat(chatText)}
              placeholder="Ask anything about MCT..."
              type="text"
              className="w-full outline-none px-4 py-3 bg-sky-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              disabled={isSending}
            />
            <button
              disabled={isSending || !chatText.trim()}
              onClick={() => handleChat(chatText)}
              className={`px-6 py-3 rounded-lg transition-all ${
                isSending || !chatText.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              } text-white font-medium`}
              aria-label="Send message"
            >
              {isSending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending
                </span>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
      <footer className="w-full flex justify-center bg-sky-300 text-gray-800 py-2 text-sm">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <p>Project by</p>
          <ul className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <li className="font-medium">NAZMUL</li>
            <li className="font-medium">AHSAN</li>
            <li className="font-medium">TAHI</li>
            <li className="font-medium">SONALI</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;