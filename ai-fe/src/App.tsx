import { useState } from "react";

function App() {
  const [chat, setChat] = useState([
    // { q: "Hey", a: "Hi, nice to meet you!", id: 0 },
    // { q: "Hey", a: "Thinking...", id: 1 },
    // { q: "Hey", a: "Hi, nice to meet you!" },
    // { q: "Hey", a: "Hi, nice to meet you!" },
    // { q: "Hey", a: "Hi, nice to meet you!" },
    // { q: "Hey", a: "Hi, nice to meet you!" },
    // { q: "Hey", a: "Hi, nice to meet you!" },
    // { q: "Hey", a: "Hi, nice to meet you!" },
  ]);

  async function handleChat(text: string) {
    setChat((prevChat) => {
      return [
        ...prevChat,
        { q: text, a: "Thinking...", id: prevChat.length + 1 },
      ];
    });

  }

  return (
    <div className="bg-sky-200 min-h-screen w-full flex flex-col justify-between">
      <div className="flex justify-center items-center mt-14">
        {/* // chatbox */}
        <div className="w-xl">
          {chat.length ? (
            <div className="overflow-y-auto max-h-[70vh] mb-4">
              {chat.map((chat) => (
                <div key={chat.id} className="mb-2">
                  <div className="flex items-center gap-2 mb-2 bg-gray-400/40 px-4 py-2 rounded">
                    <div className="size-8 bg-red-500 rounded-full" />
                    <p>{chat.q}</p>
                  </div>
                  <div
                    className={`flex items-center gap-2 bg-white/40 px-4 py-2 rounded ${
                      chat.a === "Thinking..." && "animate-pulse"
                    }`}>
                    <div className="size-8 bg-red-500 rounded-full px-4 py-2" />
                    <p>{chat.a}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center mb-8">
              <h1 className="text-4xl mb-2">Hi, I'm ASK-MCT 👋</h1>
              <p>
                Ask me anything about MCT (Multimedia and Creative Technology)
                department of Daffodil International Univarsity.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              placeholder="Ask anything about MCT..."
              type="text"
              className="w-full outline-hidden px-4 py-4 bg-sky-300 rounded"
            />
            <button className="px-8 py-4 bg-blue-600 text-white rounded hover:bg-blue-600/80 duration-300 cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
      <footer className="w-full flex justify-center bg-sky-300 text-gray-800 py-2 italic gap-4">
        <p>Project by</p>
        <ul className="flex gap-4">
          <li>NAZMUL</li>
          <li>AHSAN</li>
          <li>TAHI</li>
          <li>SONALI</li>
        </ul>
      </footer>
    </div>
  );
}

export default App;
