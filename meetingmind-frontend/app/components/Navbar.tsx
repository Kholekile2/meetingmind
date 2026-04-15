// This is the navigation bar shown at the top of every protected page
// It shows the app name, a link to upload a meeting, and the user's avatar and sign out button
// Clicking the MeetingMind logo always takes the user back to the dashboard

"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">

      {/* App name - clicking it goes to the dashboard */}
      <Link href="/dashboard" className="text-xl font-bold text-blue-600">
        MeetingMind
      </Link>

      <div className="flex items-center gap-6">

        {/* Link to the upload page */}
        <Link
          href="/upload"
          className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
        >
          + New Meeting
        </Link>

        {/* Clerk's built-in user avatar and sign out button */}
        <UserButton />

      </div>
    </nav>
  );
}