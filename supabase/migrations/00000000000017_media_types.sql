-- Add 'slides' and 'link' to media_attachments type check
ALTER TABLE public.media_attachments
DROP CONSTRAINT IF EXISTS media_attachments_media_type_check;

ALTER TABLE public.media_attachments
ADD CONSTRAINT media_attachments_media_type_check
CHECK (media_type IN ('pdf', 'video', 'audio', 'link', 'embed', 'slides'));
