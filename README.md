# St. Peter's Church of Uganda App

This is a full-featured church management and community app built with React, Vite, and Supabase.

## 🚀 Deployment Checklist

To ensure your app works correctly after linking to GitHub and deploying (e.g., to Netlify, Vercel, or Cloud Run), follow these steps:

### 1. Supabase Project Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase_setup.sql` from this repository and run it. This will create all tables, policies, and functions.
4. Go to **Database -> Replication**.
5. Click on the `supabase_realtime` publication and ensure the `notifications` table is toggled **ON**. This is required for instant notifications.

### 2. Environment Variables
In your deployment platform (Netlify, Vercel, etc.), add the following environment variables:
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `GEMINI_API_KEY`: (Optional) If you use AI features.

### 3. Storage Configuration
1. In Supabase, go to **Storage**.
2. Ensure a bucket named `church-assets` exists and is set to **Public**.
3. The SQL script should have created the policies, but double-check that users can upload to `avatars/` and admins can upload to other folders.

### 4. Admin Setup
To make yourself an admin:
1. Sign up through the app normally.
2. Go to the Supabase **Table Editor** -> `users` table.
3. Find your user row and change the `role` from `member` to `admin`.

## 🛠 Troubleshooting Data Fetching
If the app loads but shows no data:
- **Check RLS Policies**: Ensure the `supabase_setup.sql` script ran successfully. If RLS is on but there are no "Select" policies, data will be hidden.
- **Check Console Errors**: Open the browser inspector (F12) to see if there are "401 Unauthorized" or "404 Not Found" errors.
- **Environment Variables**: Ensure they start with `VITE_` if you are using Vite.

## 📱 Features
- **Real-time Notifications**: Instant alerts for announcements and approvals.
- **Ministry Management**: Join and serve in church ministries.
- **Sermons & Gallery**: Watch and listen to church content.
- **Daily Bread**: Daily devotions and scripture.
- **Hymn Book**: Full digital hymn book.
- **Prayer Requests**: Submit and track prayer needs.
