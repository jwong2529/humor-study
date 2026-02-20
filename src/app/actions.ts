'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitVote(captionId: string, voteValue: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to vote')
  }

  // Ensure voteValue is valid (1 or -1) as per table constraint
  if (voteValue !== 1 && voteValue !== -1) {
    console.warn("Invalid vote value attempted:", voteValue);
    return;
  }

  const payload = {
    profile_id: user.id,
    caption_id: captionId,
    vote_value: voteValue,
    created_datetime_utc: new Date().toISOString(),
    modified_datetime_utc: new Date().toISOString(),
  };

  console.log("Submitting vote:", payload);

  const { error } = await supabase.from('caption_votes').upsert(
    payload,
    { onConflict: 'profile_id, caption_id' }
  )

  if (error) {
    console.error('Database error details:', JSON.stringify(error, null, 2))
    throw error
  }

  revalidatePath('/')
}
