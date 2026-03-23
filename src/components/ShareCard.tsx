"use client"

import { useState, useEffect, useCallback } from "react"

interface ShareCardProps {
  festivalName: string
  headliners: string[]
  venueName: string
  vibe: string
  onClose: () => void
  isOpen: boolean
}

export default function ShareCard({
  festivalName,
  headliners,
  venueName,
  vibe,
  onClose,
  isOpen,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [isOpen])

  const shareText = [
    `\u{1F3B5} Check out my festival: ${festivalName.toUpperCase()} \u{1F3B5}`,
    "",
    `HEADLINERS: ${headliners.join(" / ")}`,
    `\u{1F4CD} ${venueName}`,
    "",
    `Built with Festival Mainstage Builder \u{2728}`,
  ].join("\n")

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = shareText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareText])

  const handleTwitterShare = useCallback(() => {
    const tweetText = encodeURIComponent(shareText)
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      "_blank",
      "noopener,noreferrer"
    )
  }, [shareText])

  const handleDownloadPoster = useCallback(() => {
    // Placeholder for poster download functionality
    console.log("Download poster triggered for:", festivalName)
  }, [festivalName])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border effect */}
        <div className="bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-600 p-[2px] rounded-2xl">
          <div className="bg-gray-950 rounded-2xl p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              aria-label="Close share dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 bg-clip-text text-transparent">
                Share Your Festival
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Spread the word about your creation
              </p>
            </div>

            {/* Festival summary card */}
            <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 border border-white/10 rounded-xl p-5 mb-6">
              <h3 className="text-xl font-extrabold text-white tracking-wide uppercase mb-3">
                {festivalName}
              </h3>

              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    Headliners
                  </span>
                  <p className="text-white/90 font-medium">
                    {headliners.join(" / ")}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    Venue
                  </span>
                  <p className="text-white/90 font-medium">{venueName}</p>
                </div>

                {vibe && (
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                      Vibe
                    </span>
                    <p className="text-white/70 italic">{vibe}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Copy to Clipboard */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-zinc-600 to-zinc-500 hover:from-zinc-500 hover:to-zinc-400 text-white shadow-lg shadow-zinc-900/30 hover:shadow-zinc-800/40 active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>

              {/* Download Poster */}
              <button
                onClick={handleDownloadPoster}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 active:scale-[0.98]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Poster
              </button>

              {/* Twitter/X Share */}
              <button
                onClick={handleTwitterShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 active:scale-[0.98]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
