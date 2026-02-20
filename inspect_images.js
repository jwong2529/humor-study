
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectImages() {
  const { data, error } = await supabase.from('images').select('*').limit(1);
  if (error) {
    console.error('Error fetching images:', error);
  } else {
    console.log('Images table structure (first row):', data);
  }
}

inspectImages();
