'use client'

import { createClient } from '@/utils/supabase/client'
import AuthButton from '@/components/AuthButton'
import SwipeableCard from '@/components/SwipeableCard'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function ListPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchCaptions = async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('captions')
        .select(`
          *,
          images (
            url
          ),
          caption_votes (
            vote_value,
            profile_id
          )
        `)
      if (error) {
        setError(error)
      } else {
        // Filter out rows without images and shuffle
        const validRows = data
          .filter((item: any) => item.images && item.images.url)
          .sort(() => Math.random() - 0.5)
        setRows(validRows)
      }
    }

    const fetchUser = async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchCaptions()
    fetchUser()
  }, [])

  const handleSwipe = () => {
    setCurrentIndex(currentIndex + 1)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 w-full">
      <main className="p-8 lg:p-12 max-w-7xl mx-auto flex flex-col items-center">
        <nav className="w-full flex justify-between items-center mb-12 border-b border-slate-700 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Humor Study</h1>
          </div>
          <div className="flex items-center gap-6">
            {user && (
              <Link
                href="/upload"
                className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
              >
                Upload Image
              </Link>
            )}
            <AuthButton user={user} />
          </div>
        </nav>

        {error ? (
          <div className="p-8 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-200 w-full">
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
            <p>{error.message}</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700 max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome</h2>
              <p className="text-slate-400 text-lg">Please sign in to vote on captions.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-2xl">
            <div className="flex justify-center items-center h-[750px] w-full relative mb-8">
              {rows.length > 0 && currentIndex < rows.length ? (
                <SwipeableCard
                  key={rows[currentIndex].id}
                  captionId={rows[currentIndex].id}
                  onSwipe={handleSwipe}
                >
                  <div className="group bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl hover:border-blue-500/50 transition-all duration-300 overflow-hidden flex flex-col h-full select-none">
                    {/* Header with ID */}
                    <div className="bg-[#334155] px-6 py-4 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Record Entry</span>
                      <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/20">
                        ID: {rows[currentIndex].id?.substring(0, 8)}...
                      </span>
                    </div>

                    {/* Image Section */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex-1 min-h-0">
                      {rows[currentIndex].images?.url ? (
                        <img
                          src={rows[currentIndex].images.url}
                          alt="Caption Context"
                          draggable={false}
                          className="w-full h-full object-contain pointer-events-none bg-black"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-medium">
                          No Image Available
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-8 space-y-6 flex-shrink-0 bg-[#1e293b]">
                      <div className="relative pl-6 border-l-2 border-slate-700 hover:border-blue-500 transition-colors">
                        <span className="absolute -left-[1.25rem] top-2 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                        <span className="block text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2">
                          CAPTION
                        </span>
                        <p className="text-white text-xl leading-relaxed font-medium pointer-events-none">
                          {rows[currentIndex].content || "No caption content provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwipeableCard>
              ) : (
                <div className="text-center w-full">
                  <p className="text-slate-500 text-2xl font-bold italic tracking-tight">No more captions to vote on.</p>
                </div>
              )}
            </div>

            {/* Swipe Instructions */}
            {rows.length > 0 && currentIndex < rows.length && (
              <div className="flex gap-12 text-slate-400 font-bold tracking-widest text-sm uppercase animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xl">←</span> Swipe Left to Downvote
                </div>
                <div className="flex items-center gap-2">
                  Swipe Right to Upvote <span className="text-green-500 text-xl">→</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
