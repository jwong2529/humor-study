'use client'

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user?: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const supabase = createClient()

  const handleSignIn = async () => {
    const getURL = () => {
      let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? 
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
        'http://localhost:3000/';
      
      url = url.includes('http') ? url : `https://${url}`;
      url = url.endsWith('/') ? url.slice(0, -1) : url;
      return url;
    };

    const redirectTo = `${getURL()}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo, // This will now be your specific Vercel URL
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

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
            className="py-2 px-4 rounded-md no-underline bg-slate-700 hover:bg-slate-800 text-white text-sm"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="py-2 px-4 rounded-md no-underline bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          Sign In with Google
        </button>
      )}
    </div>
  )
}
