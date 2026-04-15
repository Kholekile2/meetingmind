// This is the landing page - the first thing users see when they visit the site
// If the user is already logged in, they are redirected straight to the dashboard
// If not, they see a welcome page with sign in and sign up buttons

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  // auth() reads the current user's session from Clerk
  const { userId } = await auth();

  // If the user is already signed in, skip the landing page and go straight to dashboard
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">

      {/* Top navigation bar - shows logo and sign in / sign up links */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-blue-600">MeetingMind</span>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero section - the main headline and call to action buttons */}
      <main className="max-w-4xl mx-auto px-8 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Turn messy meetings into
          <span className="text-blue-600"> clear, actionable notes</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Upload a recording or paste a transcript. MeetingMind uses AI to generate
          summaries, extract action items, identify key decisions, and let you
          chat with your meeting.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-lg"
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className="text-gray-600 px-8 py-3 rounded-lg font-medium hover:text-blue-600 transition text-lg border border-gray-200 hover:border-blue-300"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Features section - shows the four main features of the app */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
          Everything you need from your meetings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "📝",
              title: "AI Summaries",
              description: "Get a clear 2-3 paragraph summary of every meeting automatically"
            },
            {
              icon: "✅",
              title: "Action Items",
              description: "Never miss a task — AI extracts who is responsible and when it is due"
            },
            {
              icon: "🎯",
              title: "Key Decisions",
              description: "See every important decision made in the meeting at a glance"
            },
            {
              icon: "💬",
              title: "Chat with Meetings",
              description: "Ask questions like what did we decide about the budget and get instant answers"
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        Built with Next.js, FastAPI, MongoDB, and Google Gemini
      </footer>

    </div>
  );
}