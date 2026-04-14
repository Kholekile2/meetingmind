// This is the upload page where users can submit a meeting
// Users can either upload an audio file or paste a transcript as text

"use client";
// "use client" means this component runs in the browser, not on the server
// We need this because we are using useState and handling form interactions

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { user } = useUser();
  // useRouter lets us redirect the user to another page after uploading
  const router = useRouter();

  // Track which upload method the user has selected
  const [uploadType, setUploadType] = useState<"audio" | "text">("audio");
  // Store the meeting title the user types
  const [title, setTitle] = useState("");
  // Store the selected audio file
  const [audioFile, setAudioFile] = useState<File | null>(null);
  // Store the pasted transcript text
  const [transcript, setTranscript] = useState("");
  // Track whether we are currently uploading
  const [loading, setLoading] = useState(false);
  // Store any error messages to show the user
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    // Prevent the page from refreshing when the form is submitted
    e.preventDefault();
    setError("");

    // Basic validation
    if (!title.trim()) {
      setError("Please enter a meeting title");
      return;
    }
    if (uploadType === "audio" && !audioFile) {
      setError("Please select an audio file");
      return;
    }
    if (uploadType === "text" && !transcript.trim()) {
      setError("Please paste a transcript");
      return;
    }

    setLoading(true);

    try {
      // FormData is how we send files and text together in one request
      const formData = new FormData();
      formData.append("clerk_user_id", user?.id || "");
      formData.append("title", title);

      if (uploadType === "audio" && audioFile) {
        formData.append("audio_file", audioFile);
      } else {
        formData.append("transcript", transcript);
      }

      // Send the data to our FastAPI backend
      const response = await fetch("http://localhost:8000/meetings/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      // Redirect to dashboard after successful upload
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      // Always stop the loading state when done
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Upload a Meeting
        </h1>
        <p className="text-gray-500 mb-8">
          Upload an audio recording or paste a transcript
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Meeting title input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly team standup"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Toggle between audio and text */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUploadType("audio")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                uploadType === "audio"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Upload Audio
            </button>
            <button
              type="button"
              onClick={() => setUploadType("text")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                uploadType === "text"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Paste Transcript
            </button>
          </div>

          {/* Audio file input */}
          {uploadType === "audio" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio File (mp3, mp4, wav, m4a)
              </label>
              <input
                type="file"
                accept=".mp3,.mp4,.wav,.m4a"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
          )}

          {/* Text transcript input */}
          {uploadType === "text" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                placeholder="Paste your meeting transcript here..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Uploading..." : "Upload Meeting"}
          </button>

        </form>
      </div>
    </main>
  );
}