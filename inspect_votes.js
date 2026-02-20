
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectVotes() {
  const { data, error } = await supabase.from('caption_votes').select('*').limit(1);
  if (error) {
    console.error('Error fetching votes:', error);
  } else {
    console.log('Caption Votes table structure (first row):', data);
  }
}

inspectVotes();
