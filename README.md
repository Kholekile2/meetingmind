# MeetingMind

MeetingMind is an AI-powered meeting summariser. You upload a meeting recording or paste a transcript and the app automatically generates a summary, extracts action items with owners, identifies key decisions, and lets you chat with the meeting to ask questions about what was discussed.

Live app: https://meetingmind-sigma.vercel.app

---

## What it does

When you upload a meeting transcript or audio file, MeetingMind will:

- Generate a structured summary of the meeting
- Extract action items and who is responsible for each one
- Identify key decisions that were made
- Let you ask questions about the meeting in a chat interface
- Save everything so you can come back and review it later

---

## Tech Stack

**Frontend**
- Next.js 16 with TypeScript
- Tailwind CSS
- Clerk for authentication
- Deployed on Vercel

**Backend**
- Python with FastAPI
- Motor for async MongoDB operations
- Cloudinary for audio file storage
- Deployed on Railway

**Database**
- MongoDB Atlas

**AI**
- Anthropic Claude Haiku for generating summaries, action items, and key decisions
- Claude Haiku also powers the chat feature

---

## Features

- Sign up and log in with email or Google
- Upload an audio file (mp3, m4a, wav) or paste a transcript as text
- You can also upload a transcript document (txt, docx, csv, rtf)
- AI generates a summary, action items with owners and due dates, and key decisions
- Chat with your meeting and ask questions like "what did we decide about the budget?"
- Dashboard shows all your past meetings with a summary preview
- Delete meetings and all related data

---

## How to run locally

You need Node.js, Python 3.11, and Git installed.

**Clone the repo**

```
git clone https://github.com/Kholekile2/meetingmind.git
cd meetingmind
```

**Set up the backend**

```
cd meetingmind-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `meetingmind-backend` folder and add these values:

```
MONGODB_URL=your_mongodb_connection_string
DB_NAME=meetingmind
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
ALLOWED_ORIGINS=http://localhost:3000
```

Start the backend:

```
uvicorn main:app --reload
```

**Set up the frontend**

```
cd meetingmind-frontend
npm install
```

Create a `.env.local` file in the `meetingmind-frontend` folder and add these values:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_OUT_URL=/
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the frontend:

```
npm run dev
```

The app will be running at http://localhost:3000

---

## Services you need to set up

To run this project you need free accounts on these platforms:

- **MongoDB Atlas** at https://mongodb.com/cloud/atlas for the database
- **Clerk** at https://clerk.com for authentication
- **Cloudinary** at https://cloudinary.com for storing audio files
- **Anthropic** at https://console.anthropic.com for the Claude AI API

---

## Project structure

```
meetingmind/
├── meetingmind-frontend/       Next.js frontend
│   ├── app/
│   │   ├── page.tsx            Landing page
│   │   ├── dashboard/          Dashboard showing all meetings
│   │   ├── upload/             Upload a new meeting
│   │   ├── meetings/[id]/      Meeting detail page
│   │   ├── sign-in/            Sign in page
│   │   ├── sign-up/            Sign up page
│   │   └── components/         Shared components like Navbar and chat
│   └── proxy.ts                Clerk middleware for protected routes
│
└── meetingmind-backend/        FastAPI backend
    ├── main.py                 App entry point
    ├── database.py             MongoDB connection
    ├── ai_processor.py         Claude AI processing
    └── routers/
        ├── meetings.py         Meeting endpoints
        └── webhooks.py         Clerk webhook for saving users
```

---

## API endpoints

```
GET    /                              Health check
GET    /health                        Database connection check
POST   /webhooks/clerk                Clerk webhook for new users
POST   /meetings/upload               Upload a meeting
GET    /meetings                      Get all meetings for a user
GET    /meetings/{id}                 Get a single meeting
POST   /meetings/{id}/chat            Send a chat message
GET    /meetings/{id}/chat            Get chat history
DELETE /meetings/{id}                 Delete a meeting
```

---

## What I learned building this

This was my third portfolio project and the first one where I used Python for the backend instead of ASP.NET Core. A few things I picked up along the way:

- FastAPI is very straightforward to work with and the automatic Swagger docs at /docs make testing endpoints easy
- MongoDB with Motor for async operations works well but the SSL settings need attention when deploying to cloud platforms
- Running AI in the background with asyncio.create_task means users get an instant response while processing continues
- Gemini's free tier is unreliable for production use. Claude Haiku from Anthropic is much more consistent
- CORS issues only show up in production so it is worth testing with the real deployed URLs early

---

## Author

Kholekile Mpengesi

GitHub: https://github.com/Kholekile2

LinkedIn: https://www.linkedin.com/in/kholekilempengesi/
