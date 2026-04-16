// This is the dashboard page - the first page users see after signing in
// It shows all their uploaded meetings as clickable cards
// If they have no meetings yet, it shows a friendly empty state

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";

// Fetches all meetings for the logged in user from the backend
async function getMeetings(userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/meetings?clerk_user_id=${userId}`,
      // no-store means Next.js always fetches fresh data instead of using a cached version
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  // Get the current logged in user's ID from Clerk
  const { userId } = await auth();

  // If no user is logged in, redirect to sign in page
  if (!userId) redirect("/sign-in");

  const meetings = await getMeetings(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Page header with title and upload button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Your Meetings</h1>
            <p className="text-sm text-gray-400 mt-1">
              {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}
            </p>
          </div>
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + New Meeting
          </Link>
        </div>

        {/* Empty state - shown when the user has no meetings yet */}
        {meetings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">🎙️</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              No meetings yet
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Upload your first meeting to get started
            </p>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Upload a meeting
            </Link>
          </div>
        ) : (
          // Meeting cards grid - each card links to the meeting detail page
          <div className="grid gap-4">
            {meetings.map((meeting: any) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id || meeting._id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-800 mb-1 truncate">
                      {meeting.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {new Date(meeting.created_at).toLocaleDateString("en-ZA", {
                        year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>

                  {/* Status badge - colour changes based on meeting status */}
                  <span className={`ml-4 shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                    meeting.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : meeting.status === "processing"
                      ? "bg-yellow-100 text-yellow-700"
                      : meeting.status === "failed"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {meeting.status}
                  </span>
                </div>

                {/* Show a preview of the summary if the meeting is completed */}
                {meeting.summary && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {meeting.summary}
                  </p>
                )}

                {/* Show a subtle arrow to indicate the card is clickable */}
                <div className="mt-4 flex items-center text-xs text-blue-500 font-medium">
                  View meeting →
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}