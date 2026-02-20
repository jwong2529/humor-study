
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyVotes() {
  const { count, error } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching vote count:', error);
  } else {
    console.log(`Total votes stored in database: ${count}`);
    
    // Also fetch the last 3 votes to show recent activity
    const { data: recentVotes, error: recentError } = await supabase
        .from('caption_votes')
        .select('created_datetime_utc, vote_value, caption_id')
        .order('created_datetime_utc', { ascending: false })
        .limit(3);
        
    if (!recentError && recentVotes.length > 0) {
        console.log('Most recent votes:', recentVotes);
    }
  }
}

verifyVotes();
