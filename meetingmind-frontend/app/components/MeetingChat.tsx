// This is the chat component for the meeting detail page
// It lets users ask questions about the meeting and get AI answers
// It is a client component because it handles user input and updates the UI dynamically

"use client";

import { useState } from "react";

// This defines the shape of a single chat message
type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

// These are the props this component receives from the meeting detail page
type Props = {
  meetingId: string;       // The ID of the meeting we are chatting about
  userId: string;          // The logged in user's Clerk ID
  initialMessages: Message[]; // Chat history loaded from MongoDB when the page opens
};

export default function MeetingChat({ meetingId, userId, initialMessages }: Props) {
  // messages holds all chat messages shown in the UI
  // We start with the history loaded from the server
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  // input holds what the user is currently typing
  const [input, setInput] = useState("");

  // loading is true while we are waiting for the AI to respond
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    // Do nothing if the input is empty or we are already waiting for a response
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    // Clear the input field immediately so the user can type another question
    setInput("");

    // Add the user's message to the UI right away without waiting for the server
    // This makes the chat feel instant and responsive
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    setLoading(true);

    try {
      // Send the message to our FastAPI backend
      const formData = new FormData();
      formData.append("clerk_user_id", userId);
      formData.append("message", userMessage);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/meetings/${meetingId}/chat`,
        { method: "POST", body: formData }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Chat failed");
      }

      // Add the AI response to the UI
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);

    } catch (err: any) {
      // If something goes wrong, show an error message in the chat
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Allow the user to send a message by pressing Enter
    // Shift+Enter adds a new line instead of sending
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Chat messages area */}
      <div className="flex flex-col gap-3 min-h-[200px] max-h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          // Show a hint when there are no messages yet
          <p className="text-sm text-gray-400 text-center py-8">
            Ask anything about this meeting — decisions, action items, who said what.
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  // User messages appear on the right in blue
                  ? "bg-blue-600 text-white rounded-br-sm"
                  // Assistant messages appear on the left in gray
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {/* Show a typing indicator while waiting for AI */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Message input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this meeting..."
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Send
        </button>
      </div>

    </div>
  );
}