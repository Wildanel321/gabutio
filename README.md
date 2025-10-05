# MemeLand - Meme Upload & Sharing Platform

A modern, full-featured meme sharing platform built with Next.js, Supabase, and TailwindCSS. Users can upload memes, comment, like, and earn XP to level up and compete on the leaderboard.

## Features

- **User Authentication** - Email/password authentication with Supabase Auth
- **Upload Memes** - Upload images with optional captions (+10 XP per upload)
- **Like System** - Like/unlike memes (+2 XP per like)
- **Comments** - Comment on memes (+3 XP per comment)
- **XP & Leveling** - Earn XP through activities, level up every 100 XP
- **Leaderboard** - Global rankings based on total XP
- **User Profiles** - View stats, memes, level, and rank
- **Dark Mode** - Toggle between light and dark themes
- **Real-time Updates** - Live comment updates using Supabase Realtime
- **Infinite Scroll** - Load more memes as you scroll
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend & Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works perfectly)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd memeland
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Fill in your Supabase credentials in `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Database is already set up!**
   - The migrations have been applied automatically
   - Your database schema includes:
     - `profiles` table for user data
     - `memes` table for uploaded memes
     - `comments` table for comments
     - `likes` table for likes
     - Triggers for automatic XP calculation
     - Storage bucket for meme images

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Register a new account
   - Start uploading memes!

## Database Schema

### Tables

- **profiles** - User profiles with XP, level, and rank
- **memes** - Uploaded memes with image URLs and captions
- **comments** - Comments on memes
- **likes** - User likes on memes

### XP System

- Upload a meme: +10 XP
- Like a meme: +2 XP
- Comment on a meme: +3 XP
- Level up: Every 100 XP = 1 level

### Rank Calculation

Ranks are automatically calculated based on total XP. The user with the highest XP gets rank #1, and so on.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy!

Your app will be live in minutes.

## Project Structure

```
memeland/
├── app/                      # Next.js app directory
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── upload/              # Upload meme page
│   ├── profile/[id]/        # User profile page
│   ├── leaderboard/         # Leaderboard page
│   └── page.tsx             # Home page (meme feed)
├── components/              # React components
│   ├── Header.tsx           # Navigation header
│   ├── MemeCard.tsx         # Meme display card
│   ├── CommentSection.tsx   # Comments component
│   └── ui/                  # shadcn/ui components
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                     # Utility functions
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Helper functions
└── .env                     # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License
