import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center min-h-screen bg-[#0f172a] text-slate-200">
      <div className="w-full">
        <div className="py-6 font-bold bg-purple-900 text-center text-white">
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center">
        <main className="flex-1 flex flex-col gap-6 text-center">
          <h2 className="font-bold text-4xl mb-4 text-white">Gated Content</h2>
          <p className="text-xl">Welcome, <span className="text-blue-400 font-bold">{user.email}</span>!</p>
          <p className="text-slate-400">You have successfully signed in using Google OAuth.</p>
          
          <div className="mt-8">
            <Link 
              href="/"
              className="py-3 px-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors shadow-lg"
            >
              ← Back to Home
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
