// This is the upload page where users submit a new meeting
// Users can either upload an audio file or paste a transcript as plain text
// After uploading, the user is redirected to the dashboard while AI processes in the background

"use client";
// "use client" is needed because this page uses useState and handles form interactions

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function UploadPage() {
  // useUser gives us the currently logged in user's details from Clerk
  const { user } = useUser();

  // useRouter lets us redirect the user to another page after uploading
  const router = useRouter();

  // Track which upload method the user has selected - audio file or text transcript
  const [uploadType, setUploadType] = useState<"audio" | "text">("audio");

  // Store the meeting title the user types
  const [title, setTitle] = useState("");

  // Store the selected audio file
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Store the pasted transcript text
  const [transcript, setTranscript] = useState("");

  // Track whether transcript input is pasted text or an uploaded document
  const [transcriptInputType, setTranscriptInputType] = useState<"paste" | "document">("paste");

  // Store the selected transcript document
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // Track whether we are currently uploading
  const [loading, setLoading] = useState(false);

  // Store any error messages to show the user
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    // Prevent the page from refreshing when the form is submitted
    e.preventDefault();
    setError("");

    // Validate the form before sending
    if (!title.trim()) {
      setError("Please enter a meeting title");
      return;
    }
    if (uploadType === "audio" && !audioFile) {
      setError("Please select an audio file");
      return;
    }
    if (uploadType === "text") {
      if (transcriptInputType === "paste" && !transcript.trim()) {
        setError("Please paste a transcript");
        return;
      }

      if (transcriptInputType === "document" && !transcriptFile) {
        setError("Please select a transcript document");
        return;
      }
    }

    setLoading(true);

    try {
      // FormData is how we send files and text together in one HTTP request
      const formData = new FormData();
      formData.append("clerk_user_id", user?.id || "");
      formData.append("title", title);

      if (uploadType === "audio" && audioFile) {
        formData.append("audio_file", audioFile);
      } else {
        if (transcriptInputType === "document" && transcriptFile) {
          formData.append("transcript_file", transcriptFile);
        } else {
          formData.append("transcript", transcript);
        }
      }

      // Send the form data to our FastAPI backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/meetings/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      // Redirect to dashboard after successful upload
      // AI processing will continue in the background
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      // Always stop the loading state whether the upload succeeded or failed
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Back button - takes the user back to the dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition"
        >
          ← Back to dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true">📄</span>
              Upload a Meeting
            </span>
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Upload an audio recording, paste a transcript, or upload a transcript document
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Toggle between audio upload and text paste */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUploadType("audio")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                  uploadType === "audio"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                }`}
              >
                🎵 Upload Audio
              </button>
              <button
                type="button"
                onClick={() => setUploadType("text")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                  uploadType === "text"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                }`}
              >
                📝 Paste Transcript
              </button>
            </div>

            {/* Audio file input - only shown when audio upload is selected */}
            {uploadType === "audio" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audio File
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Supported formats: mp3, mp4, wav, m4a
                </p>
                <input
                  type="file"
                  accept=".mp3,.mp4,.wav,.m4a"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {/* Text transcript input - only shown when text paste is selected */}
            {uploadType === "text" && (
              <div>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setTranscriptInputType("paste")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      transcriptInputType === "paste"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    Paste Transcript
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscriptInputType("document")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      transcriptInputType === "document"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    Upload Document
                  </button>
                </div>

                {transcriptInputType === "paste" ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paste Transcript
                    </label>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={10}
                      placeholder="Paste your meeting transcript here..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transcript Document
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Supported formats: txt, md, csv, rtf, docx
                    </p>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.rtf,.docx"
                      onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </>
                )}
              </div>
            )}

            {/* Error message - only shown when there is an error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
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
    </div>
  );
}