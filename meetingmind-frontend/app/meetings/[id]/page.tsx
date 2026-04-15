// This is the meeting detail page
// It shows the full transcript, summary, action items, and key decisions for one meeting

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";

// This function fetches a single meeting from our backend
async function getMeeting(meetingId: string, userId: string) {
  try {
    const response = await fetch(
      `http://localhost:8000/meetings/${meetingId}?clerk_user_id=${userId}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// The [id] in the folder name becomes a param we can read here
export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Await params before accessing its properties
  const { id } = await params;
  const meeting = await getMeeting(id, userId);

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-gray-500">Meeting not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Meeting title and date */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{meeting.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(meeting.created_at).toLocaleDateString("en-ZA", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </p>
          {/* Status badge */}
          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
            meeting.status === "completed"
              ? "bg-green-100 text-green-700"
              : meeting.status === "processing"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-500"
          }`}>
            {meeting.status}
          </span>
        </div>

        {/* Summary section */}
        {meeting.summary && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Summary
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {meeting.summary}
            </p>
          </section>
        )}

        {/* Action items section */}
        {meeting.action_items && meeting.action_items.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Action Items
            </h2>
            <div className="space-y-3">
              {meeting.action_items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {item.task}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Owner: {item.owner}
                      {item.due_date && ` · Due: ${item.due_date}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key decisions section */}
        {meeting.key_decisions && meeting.key_decisions.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Key Decisions
            </h2>
            <ul className="space-y-2">
              {meeting.key_decisions.map((decision: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 font-bold mt-0.5">→</span>
                  {decision}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Transcript section */}
        {meeting.transcript && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Transcript
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-mono">
              {meeting.transcript}
            </p>
          </section>
        )}

      </main>
    </div>
  );
}