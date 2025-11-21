-- Enable REPLICA IDENTITY FULL for Realtime to broadcast full row data on UPDATE events
-- Without this, only the primary key is sent, and clients can't see updated column values
ALTER TABLE resumes REPLICA IDENTITY FULL;
