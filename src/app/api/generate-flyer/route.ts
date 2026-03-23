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
  venueDescription: string
  vibe: string
  stageSnapshot: string | null
  customNote: string | null
}

// ---------------------------------------------------------------------------
// Festival name generator – turns the vibe into a catchy fest name
// ---------------------------------------------------------------------------
const FESTIVAL_NAMES: Record<string, string[]> = {
  'Desert Oasis': [
    'MIRAGE FESTIVAL',
    'SANDSTORM',
    'OASIS NIGHTS',
    'DUNE FEST',
    'SOLAR FLARE',
  ],
  'Urban Jungle': [
    'NEON DISTRICT',
    'CONCRETE JUNGLE FEST',
    'MIDNIGHT CITY',
    'GRID FESTIVAL',
    'ELECTRIC AVENUE',
  ],
  'Forest Wonderland': [
    'ENCHANTED FEST',
    'DEEP WOODS',
    'FIREFLY FESTIVAL',
    'EMERALD DREAM',
    'CANOPY FEST',
  ],
  'Beach Paradise': [
    'TIDAL FEST',
    'CORAL REEF FESTIVAL',
    'SUNSET SHORE',
    'WAVE RIDER FEST',
    'GOLDEN COAST FEST',
  ],
}

function generateFestivalName(vibe: string): string {
  const names = FESTIVAL_NAMES[vibe] ?? [
    'MAINSTAGE FESTIVAL',
    'SOUNDWAVE FESTIVAL',
    'ELECTRIC HORIZON',
  ]
  return names[Math.floor(Math.random() * names.length)]
}

// ---------------------------------------------------------------------------
// Tagline generator – produces a thematic tagline based on vibe
// ---------------------------------------------------------------------------
const TAGLINES: Record<string, string[]> = {
  'Desert Oasis': [
    'Where the bass meets the dunes',
    'A sonic mirage under endless skies',
    'Lose yourself in the heat of the beat',
    'The desert pulses with sound',
    'Rhythm rising from the sands',
  ],
  'Urban Jungle': [
    'The city never sleeps, and neither will you',
    'Concrete beats for restless streets',
    'Where skyscrapers meet soundwaves',
    'Neon lights, electric nights',
    'The underground rises',
  ],
  'Forest Wonderland': [
    'Let the forest move through you',
    'Where every tree hums a melody',
    'Deep roots, deeper bass',
    'An enchanted escape into sound',
    'Nature and rhythm intertwined',
  ],
  'Beach Paradise': [
    'Ride the wave of pure sound',
    'Salt, sand, and sonic bliss',
    'Where the tide brings the beat',
    'Sun-soaked frequencies all day long',
    'The shoreline is your dance floor',
  ],
}

function generateTagline(vibe: string): string {
  const lines = TAGLINES[vibe] ?? [
    'Music beyond boundaries',
    'Feel the frequency',
    'Sound without limits',
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

// ---------------------------------------------------------------------------
// Vibe-specific image prompt descriptions
// ---------------------------------------------------------------------------
const VIBE_PROMPTS: Record<string, string> = {
  'Desert Oasis':
    'vast desert landscape at golden hour, towering sand dunes, shimmering oasis with palm trees, ' +
    'dramatic sunset sky in orange and purple, mystical mirage effects, ancient temple ruins in the distance, ' +
    'floating geometric shapes, warm tones, cinematic lighting',
  'Urban Jungle':
    'futuristic cyberpunk cityscape at night, neon-lit skyscrapers, holographic billboards, ' +
    'rain-slicked streets reflecting neon lights, electric blue and magenta color palette, ' +
    'dense urban atmosphere, glowing graffiti, flying vehicles in the distance',
  'Forest Wonderland':
    'enchanted bioluminescent forest at twilight, giant ancient trees with glowing moss, ' +
    'fireflies and floating light orbs, mystical fog, mushrooms emitting soft light, ' +
    'lush green and deep purple color palette, ethereal fairy-tale atmosphere, moonlight filtering through the canopy',
  'Beach Paradise':
    'tropical beach at sunset, crystal-clear turquoise water, palm trees silhouetted against a ' +
    'vibrant gradient sky of pink orange and gold, bioluminescent waves washing ashore, ' +
    'tiki torches, coral reef visible under water, warm dreamy atmosphere',
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lineup, venueName, venueDescription, vibe, stageSnapshot, customNote } = body

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
    const tagline = generateTagline(vibe)

    // Build posterData once so it is always returned regardless of AI outcome
    const posterData = {
      headliners: lineup.headliners.map((a) => a.name),
      subHeadliners: lineup.subHeadliners.map((a) => a.name),
      openers: lineup.openers.map((a) => a.name),
      venue: venueName,
      venueDescription: venueDescription ?? '',
      vibe,
      date: 'SUMMER 2026',
      customNote: customNote ?? null,
    }

    // -----------------------------------------------------------------
    // Attempt AI image generation via Nano Banana (Replicate) if key
    // is available. Otherwise fall back to structured poster data that
    // the client renders on a <canvas>.
    // -----------------------------------------------------------------
    let aiImageUrl: string | null = null
    const apiKey = process.env.NANO_BANANA_API_KEY

    if (apiKey) {
      try {
        const headlinerNames = lineup.headliners.map((a) => a.name).join(', ')
        const vibeDescription = VIBE_PROMPTS[vibe] ?? 'colorful abstract festival atmosphere, dramatic lighting'

        const prompt = [
          `Epic music festival poster art for "${festivalName}".`,
          `Scene: ${vibeDescription}.`,
          `Headliners: ${headlinerNames}.`,
          `Venue: ${venueName}.`,
          'Style: psychedelic concert poster art, bold typography, vivid neon colors,',
          'dark background, dramatic lighting, high detail, 4k, ultra-wide composition,',
          'professional graphic design, crowd silhouettes in the foreground.',
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
              version: 'nanobanano/nanobanano-v2:latest',
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

          // Replicate returns immediately with a prediction id; poll
          // briefly for the result (max ~30 s).
          const getUrl = prediction.urls?.get ?? prediction.url
          if (getUrl) {
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 2000))
              const poll = await fetch(getUrl, {
                headers: { Authorization: `Bearer ${apiKey}` },
              })
              const data = await poll.json()
              if (data.status === 'succeeded' && data.output) {
                aiImageUrl = Array.isArray(data.output) ? data.output[0] : data.output
                break
              }
              if (data.status === 'failed') break
            }
          }
        }
      } catch {
        // AI generation failed – aiImageUrl stays null, posterData still returned
      }
    }

    return NextResponse.json({
      success: true,
      festivalName,
      tagline,
      aiImageUrl,
      posterData,
    })
  } catch (err) {
    console.error('[generate-flyer] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
