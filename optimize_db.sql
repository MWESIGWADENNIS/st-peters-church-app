-- Performance Optimization: Adding Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON announcements(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_services_day_time ON services(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_daily_bread_date ON daily_bread(devotion_date);
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(date DESC);
CREATE INDEX IF NOT EXISTS idx_hymns_number ON hymns(number);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_church_videos_recorded_date ON church_videos(recorded_date DESC);
