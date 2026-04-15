// This is the dashboard page - the first page users see after signing in
// It shows all their uploaded meetings as cards

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";

async function getMeetings(userId: string) {
  try {
    // Fetch all meetings for this user from our FastAPI backend
    const response = await fetch(
      `http://localhost:8000/meetings?clerk_user_id=${userId}`,
      // no-store means Next.js will always fetch fresh data, not use a cache
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data;
  } catch {
    // If the backend is unreachable, just return empty array
    return [];
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();

  // If no user is logged in, send them to sign in
  if (!userId) redirect("/sign-in");

  const meetings = await getMeetings(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Your Meetings</h1>
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + New Meeting
          </Link>
        </div>

        {/* Show a message if the user has no meetings yet */}
        {meetings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No meetings yet</p>
            <p className="text-sm">Upload your first meeting to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting: any) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id || meeting._id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800 mb-1">
                      {meeting.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Show the meeting status as a coloured badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    meeting.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : meeting.status === "processing"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {meeting.status}
                  </span>
                </div>

                {/* Show a preview of the summary if available */}
                {meeting.summary && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {meeting.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}