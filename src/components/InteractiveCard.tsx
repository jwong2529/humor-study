'use client'

import React, { useRef, useState, MouseEvent } from 'react'

interface InteractiveCardProps {
    children: React.ReactNode
}

export default function InteractiveCard({ children }: InteractiveCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    // Transform values
    const [rotateX, setRotateX] = useState(0)
    const [rotateY, setRotateY] = useState(0)

    // Flare values
    const [flareOpacity, setFlareOpacity] = useState(0)
    const [flareX, setFlareX] = useState(0)
    const [flareY, setFlareY] = useState(0)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        const rect = cardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Max rotation is roughly 15 degrees at edges
        const rotateXValue = ((y - centerY) / centerY) * -15
        const rotateYValue = ((x - centerX) / centerX) * 15

        setRotateX(rotateXValue)
        setRotateY(rotateYValue)

        // Optional flare follows the mouse, normalized to 0..100%
        setFlareX((x / rect.width) * 100)
        setFlareY((y / rect.height) * 100)
        setFlareOpacity(0.15)
    }

    const handleMouseLeave = () => {
        // Reset rotations smoothly
        setRotateX(0)
        setRotateY(0)
        setFlareOpacity(0)
    }

    return (
        <div
            style={{ perspective: '2000px' }}
            className="w-full h-full pb-8 flex justify-center items-center select-none"
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-full h-full will-change-transform ease-out"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `scale(1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    transition: 'transform 0.15s ease-out',
                }}
            >
                {children}

                {/* Dynamic Highlight overlay */}
                <div
                    className="absolute inset-0 z-50 pointer-events-none rounded-2xl transition-opacity duration-300"
                    style={{
                        opacity: flareOpacity,
                        background: `radial-gradient(circle 300px at ${flareX}% ${flareY}%, rgba(255,255,255,0.8), transparent 80%)`
                    }}
                />
            </div>
        </div>
    )
}
