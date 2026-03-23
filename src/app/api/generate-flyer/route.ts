import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Artist {
  name: string
  genre: string
  slot: string
}

interface RequestBody {
  lineup: {
    headliners: Artist[]
    subHeadliners: Artist[]
    openers: Artist[]
  }
  venueName: string
  vibe: string
  stageSnapshot: string | null
}

// ---------------------------------------------------------------------------
// Festival name generator – turns the vibe into a catchy fest name
// ---------------------------------------------------------------------------
const FESTIVAL_NAMES: Record<string, string[]> = {
  'Desert Oasis': [
    'DESERT OASIS FEST 2026',
    'MIRAGE MUSIC FESTIVAL 2026',
    'SANDSTORM SESSIONS 2026',
  ],
  'Urban Jungle': [
    'CONCRETE JUNGLE FEST 2026',
    'NEON CITY FESTIVAL 2026',
    'DOWNTOWN SOUND 2026',
  ],
  'Forest Wonderland': [
    'ENCHANTED FOREST FEST 2026',
    'WOODLAND ECHOES 2026',
    'DEEP GROVE FESTIVAL 2026',
  ],
  'Beach Paradise': [
    'TIDAL WAVE FEST 2026',
    'SHORELINE SESSIONS 2026',
    'PARADISE BEACH FESTIVAL 2026',
  ],
}

function generateFestivalName(vibe: string): string {
  const names = FESTIVAL_NAMES[vibe] ?? [
    'MAINSTAGE FESTIVAL 2026',
    'SOUNDWAVE FESTIVAL 2026',
    'ELECTRIC HORIZON 2026',
  ]
  return names[Math.floor(Math.random() * names.length)]
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lineup, venueName, vibe, stageSnapshot } = body

    // Validate required fields
    if (!lineup || !lineup.headliners || !lineup.subHeadliners || !lineup.openers) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid lineup data' },
        { status: 400 },
      )
    }

    if (!venueName) {
      return NextResponse.json(
        { success: false, error: 'Missing venue name' },
        { status: 400 },
      )
    }

    const festivalName = generateFestivalName(vibe)

    // -----------------------------------------------------------------
    // Attempt AI image generation via Nano Banana 2 (Replicate) if key
    // is available. Otherwise fall back to structured poster data that
    // the client renders on a <canvas>.
    // -----------------------------------------------------------------
    const apiKey = process.env.NANO_BANANA_API_KEY

    if (apiKey) {
      try {
        const headlinerNames = lineup.headliners
          .map((a) => a.name)
          .join(', ')
        const prompt = [
          `Festival poster for "${festivalName}".`,
          `Headliners: ${headlinerNames}.`,
          `Vibe: ${vibe}. Venue: ${venueName}.`,
          'Psychedelic concert poster art style, bold typography, vivid neon colors,',
          'dark background, dramatic lighting, high detail, 4k.',
        ].join(' ')

        const replicateRes = await fetch(
          'https://api.replicate.com/v1/predictions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version:
                'nanobanano/nanobanano-v2:latest',
              input: {
                prompt,
                width: 800,
                height: 1200,
                num_outputs: 1,
              },
            }),
          },
        )

        if (replicateRes.ok) {
          const prediction = await replicateRes.json()

          // Replicate returns immediately with a prediction id; we poll
          // briefly for the result (max ~30 s).
          let output: string | null = null
          const getUrl = prediction.urls?.get ?? prediction.url
          if (getUrl) {
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 2000))
              const poll = await fetch(getUrl, {
                headers: { Authorization: `Bearer ${apiKey}` },
              })
              const data = await poll.json()
              if (data.status === 'succeeded' && data.output) {
                output = Array.isArray(data.output) ? data.output[0] : data.output
                break
              }
              if (data.status === 'failed') break
            }
          }

          if (output) {
            return NextResponse.json({
              success: true,
              festivalName,
              aiGenerated: true,
              imageUrl: output,
              posterData: {
                headliners: lineup.headliners.map((a) => a.name),
                subHeadliners: lineup.subHeadliners.map((a) => a.name),
                openers: lineup.openers.map((a) => a.name),
                venue: venueName,
                vibe,
                date: 'SUMMER 2026',
              },
            })
          }
        }
      } catch {
        // AI generation failed – fall through to structured response
      }
    }

    // -----------------------------------------------------------------
    // Fallback: structured poster data for client-side canvas rendering
    // -----------------------------------------------------------------
    return NextResponse.json({
      success: true,
      festivalName,
      aiGenerated: false,
      posterData: {
        headliners: lineup.headliners.map((a) => a.name),
        subHeadliners: lineup.subHeadliners.map((a) => a.name),
        openers: lineup.openers.map((a) => a.name),
        venue: venueName,
        vibe,
        date: 'SUMMER 2026',
        stageSnapshot: stageSnapshot ?? null,
      },
    })
  } catch (err) {
    console.error('[generate-flyer] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
