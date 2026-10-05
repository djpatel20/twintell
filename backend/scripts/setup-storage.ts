import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up storage bucket and policies...');

  // 1. Create twintell-uploads bucket if not exists
  await prisma.$executeRawUnsafe(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('twintell-uploads', 'twintell-uploads', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    ON CONFLICT (id) DO UPDATE SET public = true;
  `);

  console.log('✅ Bucket created or updated in storage.buckets');

  // 2. Set RLS policies for storage.objects so public read and authenticated/anon uploads work smoothly
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      -- Allow public access to view uploaded images
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access twintell-uploads'
      ) THEN
        CREATE POLICY "Public Access twintell-uploads" ON storage.objects
          FOR SELECT USING (bucket_id = 'twintell-uploads');
      END IF;

      -- Allow authenticated and anon inserts to twintell-uploads
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Uploads twintell-uploads'
      ) THEN
        CREATE POLICY "Allow Uploads twintell-uploads" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'twintell-uploads');
      END IF;

      -- Allow update
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update twintell-uploads'
      ) THEN
        CREATE POLICY "Allow Update twintell-uploads" ON storage.objects
          FOR UPDATE USING (bucket_id = 'twintell-uploads');
      END IF;
    END
    $$;
  `);

  console.log('✅ Storage RLS policies created');

  const buckets = await prisma.$queryRawUnsafe('SELECT id, name, public FROM storage.buckets');
  console.log('Buckets:', buckets);
}

main()
  .catch((e) => {
    console.error('Setup storage error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
