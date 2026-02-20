
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLatestVotes() {
  console.log("Fetching latest 10 votes...");
  const { data: recentVotes, error } = await supabase
        .from('caption_votes')
        .select('created_datetime_utc, vote_value, caption_id, profile_id')
        .order('created_datetime_utc', { ascending: false })
        .limit(10);

  if (error) {
    console.error('Error fetching votes:', error);
  } else {
    if (recentVotes.length === 0) {
        console.log("No votes found in the database.");
    } else {
        console.log("Latest 10 Votes in Database:");
        recentVotes.forEach((vote, i) => {
            console.log(`[${i+1}] Time: ${vote.created_datetime_utc} | Value: ${vote.vote_value} | User: ${vote.profile_id}`);
        });
        console.log("\nVote storage confirmed.");
    }
  }
}

verifyLatestVotes();
