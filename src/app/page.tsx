'use client'

import { createClient } from '@/utils/supabase/client'
import AuthButton from '@/components/AuthButton'
import SwipeableCard from '@/components/SwipeableCard'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { submitVote } from '@/app/actions'

import InteractiveCard from '@/components/InteractiveCard'

export default function ListPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [lastConsensus, setLastConsensus] = useState<{ agreement: number, total: number } | null>(null)

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

  const calculateConsensus = (index: number, voteValue: number) => {
    const caption = rows[index]
    if (!caption || !caption.caption_votes) return null
    
    const votes = caption.caption_votes as any[]
    const totalVotes = votes.length
    if (totalVotes === 0) return { agreement: 100, total: 1 }

    const sameVotes = votes.filter(v => v.vote_value === voteValue).length
    const percentage = Math.round((sameVotes / totalVotes) * 100)
    
    return { agreement: percentage, total: totalVotes }
  }

  const handleSwipe = (voteValue: number) => {
    setHistory(prev => [...prev, currentIndex])
    setLastConsensus(calculateConsensus(currentIndex, voteValue))
    setCurrentIndex(currentIndex + 1)
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const lastIndex = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setCurrentIndex(lastIndex)
    setLastConsensus(null)
  }


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!user || currentIndex >= rows.length) return
      
      if (e.key === 'ArrowRight') {
        submitVote(rows[currentIndex].id, 1)
        handleSwipe(1)
      } else if (e.key === 'ArrowLeft') {
        submitVote(rows[currentIndex].id, -1)
        handleSwipe(-1)
      } else if ((e.key === 'z' && e.metaKey) || (e.key === 'z' && e.ctrlKey)) {
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [user, currentIndex, rows, history])

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 w-full font-sans">
      <main className="p-8 lg:p-12 max-w-7xl mx-auto flex flex-col items-center">
        <nav className="w-full flex justify-between items-center mb-12 border-b border-slate-700/50 pb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1">Humor Study</h1>
            <p className="text-slate-400 text-sm font-medium">Evaluating the bounds of comedy</p>
          </div>
          <div className="flex items-center gap-6">
            {user && (
              <Link
                href="/upload"
                className="py-2.5 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                + New Caption
              </Link>
            )}
            <AuthButton user={user} />
          </div>
        </nav>

        {error ? (
          <div className="p-8 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-200 w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
            <p>{error.message}</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center w-full max-w-md animate-in fade-in zoom-in duration-700">
            <div className="p-10 bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-700 shadow-2xl">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/30">
                <span className="text-4xl">H</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Start Your Session</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">Sign in to begin judging captions and contribute to the global humor study.</p>
              <AuthButton user={null} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-2xl">
            <div className="w-full mb-8 flex items-center justify-between px-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Your Progress</span>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      style={{ width: `${(currentIndex / Math.max(rows.length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {currentIndex} / {rows.length}
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <button 
                  onClick={handleUndo}
                  className="group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition-all active:scale-95"
                >
                  <span className="text-lg group-hover:-rotate-45 transition-transform duration-300">↩</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Undo Swipe</span>
                </button>
              )}
            </div>

            <div className="flex justify-center items-center h-[600px] w-full relative mb-12">
              {rows.length > 0 && currentIndex < rows.length ? (
                <SwipeableCard
                  key={rows[currentIndex].id}
                  captionId={rows[currentIndex].id}
                  onSwipe={(val) => handleSwipe(val)}
                >
                  <InteractiveCard>
                    <div className="group bg-[#1e293b] border border-slate-700 rounded-[2rem] shadow-2xl hover:border-indigo-500/50 transition-all duration-500 overflow-hidden flex flex-col h-full select-none w-full border-t-slate-600">
                      <div className="bg-[#1e293b] px-8 py-6 flex justify-between items-center border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-sm font-bold text-slate-200 tracking-tight">Challenge #{currentIndex + 1}</span>
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Judge</span>
                      </div>

                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex-1 min-h-0 group-hover:bg-black transition-colors">
                        {rows[currentIndex].images?.url ? (
                          <img
                            src={rows[currentIndex].images.url}
                            alt="Caption Context"
                            draggable={false}
                            className="w-full h-full object-contain pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                            <span className="text-4xl opacity-20">i</span>
                            <span className="font-medium">No Image Available</span>
                          </div>
                        )}
                      </div>

                      <div className="p-10 space-y-4 flex-shrink-0 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
                        <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                          Is this funny?
                        </span>
                        <p className="text-white text-2xl leading-tight font-bold pointer-events-none tracking-tight">
                          "{rows[currentIndex].content || "No caption content provided."}"
                        </p>
                      </div>
                    </div>
                  </InteractiveCard>
                </SwipeableCard>
              ) : (
                <div className="text-center w-full animate-in fade-in zoom-in-95 duration-1000">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <span className="text-4xl">S</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">All Caught Up!</h3>
                  <p className="text-slate-500 text-lg font-medium max-w-xs mx-auto mb-8">You've reviewed all available captions for today.</p>
                  <button 
                    onClick={() => setCurrentIndex(0)}
                    className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs"
                  >
                    Review Again
                  </button>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col items-center gap-8">
              {lastConsensus && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in duration-500">
                  <div className="px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm flex items-center gap-4">
                    <span className="text-indigo-400 font-bold">Community Consensus:</span>
                    <span className="px-3 py-1 bg-indigo-500 rounded-lg text-white font-black text-sm">
                      {lastConsensus.agreement}% Agreed
                    </span>
                  </div>
                </div>
              )}

              {rows.length > 0 && currentIndex < rows.length && (
                <div className="flex gap-16 text-slate-500 font-black tracking-[0.2em] text-[10px] uppercase">
                  <div className="flex items-center gap-4 transition-all hover:text-red-400">
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 flex items-center justify-center min-w-[24px]">←</kbd>
                    Swipe Left to Downvote
                  </div>
                  <div className="flex items-center gap-4 transition-all hover:text-green-400">
                    Swipe Right to Upvote
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 flex items-center justify-center min-w-[24px]">→</kbd>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
