-- Fix RLS for notifications to allow users to insert their own notifications
-- This is needed for the "Test Notification" button and other client-side triggers
CREATE POLICY "Users can insert their own notifications" 
ON notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also ensure admins have full access (this should already exist but let's be sure)
DROP POLICY IF EXISTS "Admins can do everything on notifications" ON notifications;
CREATE POLICY "Admins can do everything on notifications" 
ON notifications FOR ALL 
TO authenticated 
USING (is_admin());
