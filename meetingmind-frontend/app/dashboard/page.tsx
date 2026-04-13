import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Welcome to MeetingMind</h1>
      <p className="text-gray-500">Your user ID: {userId}</p>
      <UserButton />
    </main>
  );
}