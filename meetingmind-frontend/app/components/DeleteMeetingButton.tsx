// This component handles deleting a meeting
// It shows a delete button and a confirmation dialog before actually deleting
// It is a client component because it handles button clicks and shows a confirmation

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  meetingId: string;  // The ID of the meeting to delete
  userId: string;     // The logged in user's Clerk ID
};

export default function DeleteMeetingButton({ meetingId, userId }: Props) {
  // confirming is true when the user has clicked delete and we are showing the confirmation
  const [confirming, setConfirming] = useState(false);

  // deleting is true while the delete request is being processed
  const [deleting, setDeleting] = useState(false);

  // useRouter lets us redirect the user to the dashboard after deletion
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);

    try {
      // Send a DELETE request to our FastAPI backend
      const response = await fetch(
        `http://localhost:8000/meetings/${meetingId}?clerk_user_id=${userId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete meeting");
      }

      // Redirect to dashboard after successful deletion
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setDeleting(false);
      setConfirming(false);
    }
  }

  // Show confirmation buttons when the user clicks delete
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-500">Are you sure?</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Show the initial delete button
  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-red-500 hover:text-red-700 text-sm font-medium transition"
    >
      Delete Meeting
    </button>
  );
}