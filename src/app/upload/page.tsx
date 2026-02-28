'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import confetti from 'canvas-confetti'

export default function UploadPage() {
    const [user, setUser] = useState<any>(null)
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<string>('')
    const [captions, setCaptions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        fetchUser()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
            setImageUrl(URL.createObjectURL(e.target.files[0]))
            setCaptions([])
            setError(null)
            setStatus('')
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.")
            return
        }

        setLoading(true)
        setError(null)
        setStatus('Getting auth token...')

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error("You must be logged in to upload.")
            }

            const token = session.access_token

            setStatus('Step 1: Generating presigned upload URL...')
            const presignedRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contentType: file.type
                })
            })

            if (!presignedRes.ok) {
                const errText = await presignedRes.text().catch(() => '')
                throw new Error(`Failed to generate presigned URL: ${presignedRes.status} ${presignedRes.statusText} - ${errText}`)
            }

            const { presignedUrl, cdnUrl } = await presignedRes.json()

            setStatus('Step 2: Uploading image to S3...')
            const uploadRes = await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            })

            if (!uploadRes.ok) {
                const errText = await uploadRes.text().catch(() => '')
                throw new Error(`Failed to upload image to S3: ${uploadRes.status} ${uploadRes.statusText} - ${errText}`)
            }

            setStatus('Step 3: Registering image in the pipeline...')
            const registerRes = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: cdnUrl,
                    isCommonUse: false
                })
            })

            if (!registerRes.ok) {
                const errText = await registerRes.text().catch(() => '')
                throw new Error(`Failed to register image: ${registerRes.status} ${registerRes.statusText} - ${errText}`)
            }

            const { imageId } = await registerRes.json()

            setStatus('Step 4: Generating captions (this might take a few moments)...')
            const captionRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageId: imageId
                })
            })

            if (!captionRes.ok) {
                const errText = await captionRes.text().catch(() => '')
                throw new Error(`Failed to generate captions: ${captionRes.status} ${captionRes.statusText} - ${errText}`)
            }

            const captionsData = await captionRes.json()
            setCaptions(captionsData)
            setStatus('Success! Captions generated.')

            // Trigger Confetti!
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#3b82f6', '#8b5cf6', '#ec4899']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#3b82f6', '#8b5cf6', '#ec4899']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

        } catch (err: any) {
            console.error(err)
            setError(err.message || "An unexpected error occurred.")
            setStatus('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen bg-[#0f172a] text-slate-200 w-full flex flex-col overflow-hidden">
            <nav className="p-6 lg:px-12 lg:py-6 w-full flex justify-between items-center border-b border-slate-700 bg-[#1e293b] shrink-0 z-20">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Upload Image</h1>
                    <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors flex items-center gap-1">
                        <span>←</span> Back to Study
                    </Link>
                </div>
                <div className="flex items-center gap-6">
                    <AuthButton user={user} />
                </div>
            </nav>

            <main className="flex-1 w-full overflow-hidden flex justify-center">
                {!user ? (
                    <div className="p-8 w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/50 rounded-3xl border border-slate-700 w-full max-w-3xl text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                            <p className="text-slate-400 text-lg mb-8">Please sign in to upload images and generate captions.</p>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8 lg:gap-12 p-6 lg:p-8 ${captions.length > 0 ? '' : 'justify-center items-start overflow-y-auto custom-scrollbar'}`}>
                        {/* LEFT COLUMN - Fixed Form */}
                        <div className={`w-full ${captions.length > 0 ? 'lg:w-[400px] shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-4' : 'max-w-2xl mx-auto'} flex flex-col gap-6 transition-all duration-500`}>
                            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 shadow-xl">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">1</span>
                                    Select an Image
                                </h2>

                                <label className="block w-full cursor-pointer">
                                    <span className="sr-only">Choose profile photo</span>
                                    <div className="flex items-center justify-center w-full h-32 px-4 transition bg-slate-800 border-2 border-slate-600 border-dashed rounded-2xl appearance-none hover:border-blue-500 hover:bg-slate-800/80 group">
                                        <span className="flex items-center space-x-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="font-medium text-slate-500 group-hover:text-blue-400 transition-colors">
                                                Drop files to Attach, or <span className="text-blue-500 underline">browse</span>
                                            </span>
                                        </span>
                                    </div>
                                    <input type="file" name="file_upload" className="hidden" accept="image/jpeg, image/jpg, image/png, image/webp, image/gif, image/heic" onChange={handleFileChange} />
                                </label>

                                {file && (
                                    <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {imageUrl && <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 shadow-xl">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">2</span>
                                    Generate Content
                                </h2>

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className={`w-full py-4 px-6 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden ${loading
                                        ? 'magic-button-loading text-white'
                                        : !file
                                            ? 'bg-slate-700 text-slate-500'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 text-white'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 sparkle-pulse"></div>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="sparkle-text relative z-10 tracking-widest uppercase text-sm">Hope you find these funny...</span>
                                        </>
                                    ) : (
                                        "Upload & Generate Captions"
                                    )}
                                </button>

                                {status && (
                                    <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${status.includes('Success') ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-blue-900/20 text-blue-400 border border-blue-800/50'} flex items-center gap-3`}>
                                        {status.includes('Success') ? (
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                                        )}
                                        {status}
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 text-red-400 text-sm font-medium flex items-start gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Results */}
                        {captions.length > 0 && (
                            <div className="w-full lg:flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-4 flex flex-col pb-20 animate-[fadeIn_0.5s_ease-out]">
                                <h2 className="text-3xl font-black text-white mb-10 border-b-2 border-slate-700/50 pb-4 px-8 hidden lg:block">
                                    Resulting Captions
                                </h2>

                                <div className="flex flex-col gap-12 w-full lg:max-w-2xl mx-auto">
                                    {captions.map((caption: any, idx) => (
                                        <div key={idx} className="group bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl hover:border-blue-500/50 transition-all duration-300 overflow-hidden flex flex-col h-full select-none">
                                            <div className="bg-[#334155] px-6 py-4 flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Generated Caption</span>
                                                <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/20">
                                                    Option {idx + 1}
                                                </span>
                                            </div>

                                            <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex-1 min-h-0">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
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

                                            <div className="p-8 space-y-6 flex-shrink-0 bg-[#1e293b]">
                                                <div className="relative pl-6 border-l-2 border-slate-700 hover:border-blue-500 transition-colors">
                                                    <span className="absolute -left-[1.25rem] top-2 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                                                    <span className="block text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2">
                                                        CAPTION
                                                    </span>
                                                    <p className="text-white text-xl leading-relaxed font-medium pointer-events-none">
                                                        {caption.content || caption.text || (typeof caption === 'string' ? caption : JSON.stringify(caption))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 1);
        }

        .magic-button-loading {
            background: linear-gradient(270deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
            background-size: 300% 300%;
            animation: magicGlow 3s ease infinite;
            border: 1px solid rgba(255,255,255,0.1);
        }

        @keyframes magicGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .sparkle-pulse {
            animation: pulseOpacity 1.5s infinite alternate;
        }

        @keyframes pulseOpacity {
            from { opacity: 0.1; }
            to { opacity: 0.4; }
        }

        .sparkle-text {
            background: linear-gradient(to right, #fff, #cbd5e1);
            -webkit-background-clip: text;
            background-clip: text;
            animation: textShine 2s infinite linear;
        }
      `}} />
        </div>
    )
}
