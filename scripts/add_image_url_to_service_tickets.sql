-- Add image_url column to service_tickets table
-- This allows storing optional images for service tickets

ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN service_tickets.image_url IS 'Optional image URL for documenting the service ticket (problems, work performed, etc.)';

-- Create index for better performance when filtering by image presence
CREATE INDEX IF NOT EXISTS idx_service_tickets_image_url ON service_tickets(image_url) WHERE image_url IS NOT NULL;
