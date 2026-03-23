import { NextRequest, NextResponse } from 'next/server'

interface Artist { name: string; genre: string; slot: string }

interface RequestBody {
  lineup: { headliners: Artist[]; subHeadliners: Artist[]; openers: Artist[] }
  venueName: string
  venueDescription: string
  vibe: string
  stageSnapshot: string | null
  customNote: string | null
}

const FESTIVAL_NAMES: Record<string, string[]> = {
  'Desert Oasis': ['MIRAGE FESTIVAL', 'SANDSTORM', 'OASIS NIGHTS', 'DUNE FEST', 'SOLAR FLARE'],
  'Urban Jungle': ['NEON DISTRICT', 'CONCRETE JUNGLE FEST', 'MIDNIGHT CITY', 'GRID FESTIVAL', 'ELECTRIC AVENUE'],
  'Forest Wonderland': ['ENCHANTED FEST', 'DEEP WOODS', 'FIREFLY FESTIVAL', 'EMERALD DREAM', 'CANOPY FEST'],
  'Beach Paradise': ['TIDAL FEST', 'CORAL REEF FESTIVAL', 'SUNSET SHORE', 'WAVE RIDER FEST', 'GOLDEN COAST FEST'],
}

const TAGLINES: Record<string, string[]> = {
  'Desert Oasis': ['Where the bass meets the dunes', 'A sonic mirage under endless skies', 'Rhythm rising from the sands'],
  'Urban Jungle': ['The city never sleeps', 'Concrete beats for restless streets', 'Neon lights, electric nights'],
  'Forest Wonderland': ['Let the forest move through you', 'Deep roots, deeper bass', 'Nature and rhythm intertwined'],
  'Beach Paradise': ['Ride the wave of pure sound', 'Salt, sand, and sonic bliss', 'The shoreline is your dance floor'],
}

const VIBE_PROMPTS: Record<string, string> = {
  'Desert Oasis':
    'Epic music festival poster set in a vast desert at golden hour. Towering sand dunes, shimmering oasis with palm trees, dramatic sunset sky in orange and purple. Festival stage silhouette in the distance with laser beams.',
  'Urban Jungle':
    'Epic music festival poster set in a futuristic cyberpunk cityscape at night. Neon-lit skyscrapers, holographic billboards, rain-slicked streets reflecting neon lights. Festival stage with massive LED screens between buildings.',
  'Forest Wonderland':
    'Epic music festival poster set in an enchanted bioluminescent forest at twilight. Giant ancient trees with glowing moss, fireflies and floating light orbs, mystical fog. Festival stage made of intertwined branches.',
  'Beach Paradise':
    'Epic music festival poster set on a tropical beach at sunset. Crystal-clear turquoise water, palm trees silhouetted against vibrant gradient sky of pink orange and gold. Festival stage on the shoreline with fireworks.',
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lineup, venueName, venueDescription, vibe, customNote } = body

    if (!lineup?.headliners || !lineup?.subHeadliners || !lineup?.openers) {
      return NextResponse.json({ success: false, error: 'Missing lineup data' }, { status: 400 })
    }

    const festivalName = pick(FESTIVAL_NAMES[vibe] ?? ['MAINSTAGE FESTIVAL', 'SOUNDWAVE FESTIVAL'])
    const tagline = pick(TAGLINES[vibe] ?? ['Feel the frequency'])

    const posterData = {
      headliners: lineup.headliners.map((a) => a.name),
      subHeadliners: lineup.subHeadliners.map((a) => a.name),
      openers: lineup.openers.map((a) => a.name),
      venue: venueName ?? 'TBD',
      venueDescription: venueDescription ?? '',
      vibe,
      date: 'SUMMER 2026',
      customNote: customNote ?? null,
    }

    // ── Attempt AI image generation via Google Gemini Imagen ──
    let aiImageUrl: string | null = null
    const geminiKey = process.env.NANO_BANANA_API_KEY

    if (geminiKey) {
      try {
        const headlinerNames = lineup.headliners.map((a) => a.name).join(', ')
        const vibeDesc = VIBE_PROMPTS[vibe] ?? 'Colorful abstract festival atmosphere with dramatic lighting and crowd silhouettes.'

        const prompt = [
          `${vibeDesc}`,
          `Festival name: "${festivalName}".`,
          `Headliners: ${headlinerNames}.`,
          `Venue: ${venueName}.`,
          'Style: psychedelic concert poster art, bold typography, vivid neon colors, dark background, dramatic lighting, high detail, professional graphic design.',
        ].join(' ')

        // Use Gemini's generateContent with Imagen model
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Generate a festival poster image: ${prompt}` }],
              }],
              generationConfig: {
                responseModalities: ['TEXT'],
              },
            }),
          },
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          // Extract any image data from the response
          const candidates = geminiData.candidates ?? []
          for (const candidate of candidates) {
            const parts = candidate.content?.parts ?? []
            for (const part of parts) {
              if (part.inlineData?.mimeType?.startsWith('image/')) {
                aiImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                break
              }
            }
            if (aiImageUrl) break
          }

          // If no image but we got text, try Imagen endpoint
          if (!aiImageUrl) {
            const imagenRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instances: [{ prompt }],
                  parameters: { sampleCount: 1, aspectRatio: '2:3' },
                }),
              },
            )

            if (imagenRes.ok) {
              const imagenData = await imagenRes.json()
              const predictions = imagenData.predictions ?? []
              if (predictions[0]?.bytesBase64Encoded) {
                aiImageUrl = `data:image/png;base64,${predictions[0].bytesBase64Encoded}`
              }
            }
          }
        }
      } catch {
        // AI generation failed silently — canvas poster is the fallback
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
