'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useFestivalStore } from '@/store/festival-store';

// ---------------------------------------------------------------------------
// Pre-defined festival venue locations
// ---------------------------------------------------------------------------
interface VenueLocation {
  name: string;
  lat: number;
  lng: number;
  description: string;
  imageUrl: string;
}

const VENUES: VenueLocation[] = [
  {
    name: 'Gorge Amphitheatre',
    lat: 46.9785,
    lng: -119.9952,
    description: 'Epic riverside canyon venue',
    imageUrl: '/venues/gorge.jpg',
  },
  {
    name: 'Empire Polo Club',
    lat: 33.6803,
    lng: -116.2389,
    description: 'Home of Coachella',
    imageUrl: '/venues/empire-polo.jpg',
  },
  {
    name: "Randall's Island",
    lat: 40.7934,
    lng: -73.921,
    description: 'NYC island festival grounds',
    imageUrl: '/venues/randalls-island.jpg',
  },
  {
    name: 'Zilker Park',
    lat: 30.2672,
    lng: -97.7431,
    description: 'SXSW territory',
    imageUrl: '/venues/zilker.jpg',
  },
  {
    name: 'Golden Gate Park',
    lat: 37.7694,
    lng: -122.4862,
    description: 'Outside Lands home',
    imageUrl: '/venues/golden-gate.jpg',
  },
  {
    name: 'Bayfront Park',
    lat: 25.7743,
    lng: -80.1863,
    description: 'Ultra Music Festival grounds',
    imageUrl: '/venues/bayfront.jpg',
  },
  {
    name: 'Grant Park',
    lat: 41.8827,
    lng: -87.6233,
    description: 'Lollapalooza home',
    imageUrl: '/venues/grant-park.jpg',
  },
  {
    name: 'Manchester Farm',
    lat: 35.4834,
    lng: -86.0589,
    description: 'Bonnaroo country',
    imageUrl: '/venues/manchester.jpg',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VenueFinder() {
  const store = useFestivalStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoOverlayRef = useRef<HTMLDivElement | null>(null);

  const [selectedPreview, setSelectedPreview] = useState<VenueLocation | null>(
    null,
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // -----------------------------------------------------------------------
  // Select a venue -> push to store and navigate
  // -----------------------------------------------------------------------
  const handleSelectVenue = useCallback(
    (venue: VenueLocation) => {
      store.setVenue({
        name: venue.name,
        lat: venue.lat,
        lng: venue.lng,
        description: venue.description,
        imageUrl: venue.imageUrl,
      });
    },
    [store],
  );

  // -----------------------------------------------------------------------
  // Google Maps initialization
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) {
      if (!apiKey) setMapError(true);
      return;
    }

    let cancelled = false;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['marker'],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any)
      .importLibrary('maps')
      .then(async ({ Map }: { Map: typeof google.maps.Map }) => {
        if (cancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: { lat: 36.7783, lng: -119.4179 },
          zoom: 5,
          mapId: 'FESTIVAL_VENUE_MAP',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
            {
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a2e' }],
            },
            {
              elementType: 'labels.text.fill',
              stylers: [{ color: '#8b8ba7' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#2a2a4a' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f0f23' }],
            },
            {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{ color: '#22223b' }],
            },
          ],
        });

        mapRef.current = map;

        // Import the marker library
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { AdvancedMarkerElement } = await (loader as any).importLibrary('marker') as { AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement };

        // Create markers for each venue
        VENUES.forEach((venue) => {
          const pinEl = document.createElement('div');
          pinEl.className = 'venue-marker-pin';
          pinEl.innerHTML = `
            <div style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #e040fb, #7c4dff);
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #fff;
              box-shadow: 0 0 12px rgba(224, 64, 251, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 16px;
                line-height: 1;
              ">&#127926;</span>
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            position: { lat: venue.lat, lng: venue.lng },
            map,
            content: pinEl,
            title: venue.name,
          });

          marker.addListener('gmp-click', () => {
            setSelectedPreview(venue);
            map.panTo({ lat: venue.lat, lng: venue.lng });
          });

          markersRef.current.push(marker);
        });

        setMapLoaded(true);
      })
      .catch((err: unknown) => {
        console.error('Google Maps failed to load:', err);
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // -----------------------------------------------------------------------
  // Venue side-panel item
  // -----------------------------------------------------------------------
  const VenueListItem = ({
    venue,
    isActive,
  }: {
    venue: VenueLocation;
    isActive: boolean;
  }) => (
    <button
      onClick={() => {
        setSelectedPreview(venue);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: venue.lat, lng: venue.lng });
          mapRef.current.setZoom(8);
        }
      }}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
        isActive
          ? 'bg-purple-900/60 border-purple-500 shadow-lg shadow-purple-500/20'
          : 'bg-gray-900/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-purple-600/40'
      } ${
        store.selectedVenue?.name === venue.name
          ? 'ring-2 ring-fuchsia-400'
          : ''
      }`}
    >
      <p className="text-sm font-semibold text-white truncate">{venue.name}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">
        {venue.description}
      </p>
    </button>
  );

  // -----------------------------------------------------------------------
  // Info card overlay (shown on marker click)
  // -----------------------------------------------------------------------
  const InfoCard = ({ venue }: { venue: VenueLocation }) => (
    <div
      ref={infoOverlayRef}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
                 w-80 rounded-2xl overflow-hidden
                 bg-gray-900/95 backdrop-blur-xl border border-purple-500/40
                 shadow-2xl shadow-purple-900/40"
    >
      {/* Gradient accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {venue.name}
            </h3>
            <p className="text-sm text-purple-300 mt-1">{venue.description}</p>
            <p className="text-xs text-gray-500 mt-1.5">
              {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
            </p>
          </div>

          <button
            onClick={() => setSelectedPreview(null)}
            className="shrink-0 text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => handleSelectVenue(venue)}
          className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm
                     bg-gradient-to-r from-fuchsia-600 to-purple-600
                     hover:from-fuchsia-500 hover:to-purple-500
                     text-white transition-all duration-200
                     shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-500/40
                     active:scale-[0.98]"
        >
          Select This Venue
        </button>
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Fallback UI (no API key)
  // -----------------------------------------------------------------------
  if (mapError || !apiKey) {
    return (
      <div className="w-full h-full min-h-[600px] bg-gray-950 text-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your Festival Venue
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pick where the magic happens
          </p>
        </div>

        {/* Fallback notice */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs">
          Map unavailable — Google Maps API key is not configured. You can still
          select a venue below.
        </div>

        {/* Venue grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {VENUES.map((venue) => {
              const isSelected = store.selectedVenue?.name === venue.name;
              return (
                <div
                  key={venue.name}
                  className={`relative rounded-2xl overflow-hidden border transition-all duration-200
                    ${
                      isSelected
                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-400/50 shadow-xl shadow-fuchsia-600/20'
                        : 'border-gray-700/60 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-900/20'
                    }
                    bg-gray-900/80 backdrop-blur`}
                >
                  {/* Decorative gradient header */}
                  <div className="h-24 bg-gradient-to-br from-purple-800/60 via-fuchsia-900/40 to-indigo-900/60 flex items-center justify-center">
                    <span className="text-4xl opacity-70">&#127926;</span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-white text-base">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-purple-300 mt-1">
                      {venue.description}
                    </p>
                    <p className="text-xs text-gray-600 mt-1.5">
                      {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
                    </p>

                    <button
                      onClick={() => handleSelectVenue(venue)}
                      className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm
                                 bg-gradient-to-r from-fuchsia-600 to-purple-600
                                 hover:from-fuchsia-500 hover:to-purple-500
                                 text-white transition-all duration-200
                                 shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-500/40
                                 active:scale-[0.98]"
                    >
                      {isSelected ? 'Selected' : 'Select This Venue'}
                    </button>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-fuchsia-500 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Editable venue details (fallback layout) */}
          {store.selectedVenue && (
            <div className="mt-6 rounded-2xl border border-purple-500/30 bg-gray-900/80 p-5 max-w-xl mx-auto">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-400">
                Edit Venue Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={store.selectedVenue.name}
                    onChange={(e) => store.updateVenueName(e.target.value)}
                    className="w-full rounded-lg border border-purple-500/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-pink-500/60 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={store.selectedVenue.description}
                    onChange={(e) => store.updateVenueDescription(e.target.value)}
                    className="w-full resize-none rounded-lg border border-purple-500/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-pink-500/60 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Venue Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes about this venue..."
                    value={store.customNotes.venue}
                    onChange={(e) => store.setCustomNote('venue', e.target.value)}
                    className="w-full resize-none rounded-lg border border-purple-500/30 bg-purple-900/20 px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-pink-500/60"
                  />
                </div>
              </div>
              <button
                onClick={() => store.setActiveTab(3)}
                className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white transition-all duration-200 shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-500/40 active:scale-[0.98]"
              >
                Confirm Venue &amp; Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main UI with map + side panel
  // -----------------------------------------------------------------------
  return (
    <div className="w-full h-full min-h-[600px] bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 shrink-0">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
          Choose Your Festival Venue
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Click a marker or pick from the list
        </p>
      </div>

      {/* Body: side panel + map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side panel - venue list */}
        <aside className="w-72 shrink-0 border-r border-gray-800 bg-gray-950/80 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Venues
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
            {VENUES.map((venue) => (
              <VenueListItem
                key={venue.name}
                venue={venue}
                isActive={selectedPreview?.name === venue.name}
              />
            ))}
          </div>

          {/* Currently selected venue indicator */}
          {store.selectedVenue && (
            <div className="px-4 py-3 border-t border-gray-800 bg-purple-950/30">
              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">
                Current venue
              </p>
              <p className="text-sm text-white font-medium mt-0.5 truncate">
                {store.selectedVenue.name}
              </p>
            </div>
          )}
        </aside>

        {/* Map + venue edit area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map area */}
          <div className="flex-1 relative">
            {/* Loading spinner */}
            {!mapLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading map...</p>
                </div>
              </div>
            )}

            {/* Map container */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Info card overlay */}
            {selectedPreview && <InfoCard venue={selectedPreview} />}
          </div>

          {/* Editable venue details (below map) */}
          {store.selectedVenue && (
            <div className="shrink-0 border-t border-gray-800 bg-gray-950/90 px-6 py-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={store.selectedVenue.name}
                    onChange={(e) => store.updateVenueName(e.target.value)}
                    className="w-full rounded-lg border border-purple-500/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-pink-500/60 focus:bg-white/10"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Description
                  </label>
                  <input
                    type="text"
                    value={store.selectedVenue.description}
                    onChange={(e) => store.updateVenueDescription(e.target.value)}
                    className="w-full rounded-lg border border-purple-500/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-pink-500/60 focus:bg-white/10"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1 block text-xs font-semibold text-purple-300/70">
                    Venue Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes about this venue..."
                    value={store.customNotes.venue}
                    onChange={(e) => store.setCustomNote('venue', e.target.value)}
                    className="w-full resize-none rounded-lg border border-purple-500/30 bg-purple-900/20 px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-pink-500/60"
                  />
                </div>
                <button
                  onClick={() => store.setActiveTab(3)}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 px-5 py-2 text-sm font-semibold text-white transition-all shadow-lg shadow-fuchsia-600/30 active:scale-[0.98]"
                >
                  Confirm &amp; Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
