'use client'

import { useSpring, animated, to } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { submitVote } from '@/app/actions'
import { useState } from 'react'

interface SwipeableCardProps {
  children: React.ReactNode
  captionId: string
  onSwipe: () => void
}

export default function SwipeableCard({ children, captionId, onSwipe }: SwipeableCardProps) {
  const [gone, setGone] = useState(false)
  const [{ x, y, rot, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    config: { friction: 50, tension: 200 }
  }))

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2 // If velocity is high, trigger swipe
    const dir = xDir < 0 ? -1 : 1 // Direction of swipe

    if (!down && trigger) {
      setGone(true)
      const voteValue = dir === 1 ? 1 : -1
      
      // Fly out animation
      api.start({
        x: (200 + window.innerWidth) * dir,
        rot: mx / 100 + dir * 10 * vx,
        scale: 1,
        config: { friction: 50, tension: 200 }
      })

      submitVote(captionId, voteValue)
        .then(() => {
             // Delay next card slightly to allow animation to complete
             setTimeout(onSwipe, 200) 
        })
        .catch((err) => {
             console.error("Vote failed", err)
             // Even if vote fails, we proceed for UX, or maybe show error toast
             // For now, proceed
             setTimeout(onSwipe, 200) 
        })
    } else {
      // Return to center
      api.start({
        x: down ? mx : 0,
        y: down ? 0 : 0,
        rot: down ? mx / 100 : 0,
        scale: down ? 1.05 : 1,
        immediate: down,
      })
    }
  })

  // Interpolate rotation and opacity for stamps
  const likeOpacity = x.to(x => (x > 20 ? x / 100 : 0))
  const nopeOpacity = x.to(x => (x < -20 ? Math.abs(x) / 100 : 0))

  if (gone) return null; // Or keep it rendered but off-screen until parent unmounts

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        touchAction: 'none',
        transform: to([x, y, rot, scale], (x, y, r, s) => `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`),
      }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing origin-bottom"
    >
      {/* Visual Indicators */}
      <animated.div 
        style={{ opacity: likeOpacity }}
        className="absolute top-8 right-8 z-50 border-4 border-green-500 text-green-500 text-4xl font-black px-4 py-2 rounded-lg transform rotate-12 bg-black/20 backdrop-blur-sm pointer-events-none"
      >
        LIKE
      </animated.div>
      <animated.div 
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 left-8 z-50 border-4 border-red-500 text-red-500 text-4xl font-black px-4 py-2 rounded-lg transform -rotate-12 bg-black/20 backdrop-blur-sm pointer-events-none"
      >
        NOPE
      </animated.div>

      {children}
    </animated.div>
  )
}
