'use client'

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user?: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const supabase = createClient()

  const handleSignIn = async () => {
    const origin = window.location.origin;

    const redirectTo = `${origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
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
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="py-2 px-4 rounded-md no-underline bg-slate-700 hover:bg-slate-800 text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="py-2 px-4 rounded-md no-underline bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
        >
          Sign In with Google
        </button>
      )}
    </div>
  )
}