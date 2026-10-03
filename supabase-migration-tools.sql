-- ============================================
-- Feature Flags + Tools
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  enabled boolean NOT NULL DEFAULT true,
  icon text DEFAULT '',
  href text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed all tool flags
INSERT INTO public.feature_flags (key, label, description, category, enabled, icon, href, sort_order) VALUES
  ('tools_hub', 'Tools Hub', 'Public tools page accessible to all users', 'tools', true, 'Wrench', '/tools', 0),
  -- Image tools
  ('tool_image_resize', 'Image Resizer', 'Batch compress and resize images, convert formats', 'image', true, 'Minimize2', '/tools/image-resize', 10),
  ('tool_image_crop', 'Image Cropper', 'Crop images to any aspect ratio', 'image', true, 'Crop', '/tools/image-crop', 11),
  ('tool_image_convert', 'Image Converter', 'Convert between PNG, JPG, WebP formats', 'image', true, 'RefreshCw', '/tools/image-convert', 12),
  ('tool_passport_photo', 'Passport Photo Maker', 'Create standard-size passport photos', 'image', true, 'IdCard', '/tools/passport-photo', 13),
  ('tool_remove_bg', 'Background Remover', 'Remove or replace background from any photo', 'image', true, 'Eraser', '/tools/remove-bg', 14),
  ('tool_color_picker', 'Color Studio', 'Pick, extract, generate palettes, check contrast', 'image', true, 'Palette', '/tools/color-picker', 15),
  -- PDF tools
  ('tool_pdf_merge', 'PDF Merge', 'Combine multiple PDFs into one', 'pdf', true, 'FilePlus', '/tools/pdf-merge', 20),
  ('tool_pdf_split', 'PDF Split', 'Split a PDF into individual pages', 'pdf', true, 'Scissors', '/tools/pdf-split', 21),
  ('tool_image_to_pdf', 'Image to PDF', 'Convert images to a single PDF document', 'pdf', true, 'FileText', '/tools/image-to-pdf', 22),
  ('tool_pdf_to_image', 'PDF to Image', 'Extract PDF pages as PNG or JPEG images', 'pdf', true, 'Image', '/tools/pdf-to-image', 23),
  ('tool_pdf_compress', 'PDF Compress', 'Reduce PDF file size for sharing', 'pdf', true, 'FileText', '/tools/pdf-compress', 24),
  ('tool_favicon', 'Favicon Generator', 'Generate favicons in all standard sizes', 'image', true, 'Star', '/tools/favicon', 16),
  -- Text & dev tools
  ('tool_json_formatter', 'JSON Formatter', 'Format, validate, and minify JSON', 'dev', true, 'Braces', '/tools/json-formatter', 30),
  ('tool_base64', 'Base64 Encoder/Decoder', 'Encode/decode Base64 strings', 'dev', true, 'Code2', '/tools/base64', 31),
  ('tool_url_encode', 'URL Encoder/Decoder', 'Encode/decode URL strings', 'dev', true, 'Link', '/tools/url-encode', 32),
  ('tool_text_counter', 'Text Counter', 'Count characters, words, sentences, paragraphs', 'text', true, 'Hash', '/tools/text-counter', 40),
  ('tool_lorem_ipsum', 'Lorem Ipsum Generator', 'Generate placeholder text', 'text', true, 'Type', '/tools/lorem-ipsum', 41),
  ('tool_password_gen', 'Password Generator', 'Generate strong, secure passwords', 'security', true, 'Key', '/tools/password-gen', 50),
  ('tool_world_clock', 'World Clock & Time Tools', 'World clock, timezone converter, meeting planner, countdown, age calculator, stopwatch', 'time', true, 'Clock', '/tools/world-clock', 60)
ON CONFLICT (key) DO NOTHING;
