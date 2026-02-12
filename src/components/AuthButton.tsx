'use client'

import { createClient } from '@/utils/supabase/client'

export default function AuthButton() {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={handleSignIn}
        className="py-2 px-4 rounded-md no-underline bg-blue-600 hover:bg-blue-700 text-white font-bold"
      >
        Sign In with Google
      </button>
      <button
        onClick={handleSignOut}
        className="py-2 px-4 rounded-md no-underline bg-slate-700 hover:bg-slate-800 text-white"
      >
        Sign Out
      </button>
    </div>
  )
}
