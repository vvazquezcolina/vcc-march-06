export interface VenueData {
  name: string
  lat: number
  lng: number
  description: string
  longDescription: string
  capacity: string
  terrain: string
  bestVibes: string[]
  famousFor: string
}

export const VENUES: VenueData[] = [
  {
    name: "Gorge Amphitheatre",
    lat: 46.9785,
    lng: -119.9952,
    description: "Epic riverside canyon",
    longDescription:
      "Carved into the basalt cliffs above the Columbia River, the Gorge Amphitheatre is widely regarded as the most scenic concert venue in the world. The stage sits at the edge of a natural canyon, giving every seat a jaw-dropping panoramic view of the river winding through ancient rock formations. As the sun sets, the sky explodes in color behind the stage, turning every show into a once-in-a-lifetime experience.",
    capacity: "27,000",
    terrain: "River canyon with dramatic cliff views",
    bestVibes: ["Desert Oasis", "Forest Wonderland"],
    famousFor: "Sasquatch Festival",
  },
  {
    name: "Empire Polo Club",
    lat: 33.6803,
    lng: -116.2389,
    description: "Home of Coachella",
    longDescription:
      "Sprawling across manicured polo fields in the heart of the Coachella Valley, the Empire Polo Club transforms each spring into the most iconic festival destination on Earth. Surrounded by swaying palm trees and backed by the rugged San Jacinto Mountains, the grounds offer a surreal contrast of lush green grass against arid desert landscape. The wide-open space allows for massive art installations, multiple stages, and that unmistakable golden-hour glow that defines the Coachella aesthetic.",
    capacity: "125,000",
    terrain: "Desert polo fields",
    bestVibes: ["Desert Oasis", "Beach Paradise"],
    famousFor: "Coachella Valley Music and Arts Festival",
  },
  {
    name: "Randall's Island",
    lat: 40.7934,
    lng: -73.921,
    description: "NYC festival island",
    longDescription:
      "Sitting in the East River between Manhattan, the Bronx, and Queens, Randall's Island is New York City's secret festival playground. The island park provides a rare stretch of open green space in the densest city in America, with the Manhattan skyline serving as an ever-present backdrop. Getting there by ferry adds an adventure-before-the-adventure feel, and the island's relative isolation from the city grid creates a contained, immersive world where urban energy meets open-air freedom.",
    capacity: "60,000",
    terrain: "Urban island park",
    bestVibes: ["Urban Jungle"],
    famousFor: "Governors Ball Music Festival",
  },
  {
    name: "Zilker Park",
    lat: 30.2672,
    lng: -97.7431,
    description: "ACL Festival grounds",
    longDescription:
      "Austin's beloved 350-acre urban oasis sits right along the banks of Lady Bird Lake, blending the city's legendary live-music culture with wide-open green space. During Austin City Limits, the rolling hills fill with stages that range from intimate to arena-scale, all framed by the downtown skyline peeking through clusters of ancient oak trees. The park's central location means festival-goers spill out into Austin's famous Sixth Street bar scene when the music stops, keeping the energy alive well past midnight.",
    capacity: "75,000",
    terrain: "Rolling green hills",
    bestVibes: ["Forest Wonderland", "Urban Jungle"],
    famousFor: "Austin City Limits Music Festival",
  },
  {
    name: "Golden Gate Park",
    lat: 37.7694,
    lng: -122.4862,
    description: "Outside Lands home",
    longDescription:
      "Stretching from the Haight-Ashbury neighborhood all the way to the Pacific Ocean, Golden Gate Park is a thousand-acre urban forest steeped in counterculture history. Towering eucalyptus and cypress trees create a natural cathedral effect around the festival stages, while the famous San Francisco fog rolls in from the coast to add an ethereal, almost mystical atmosphere. Outside Lands leans into the city's food and wine culture as much as the music, making it the most gastronomically adventurous festival venue in the country.",
    capacity: "70,000",
    terrain: "Coastal forest park",
    bestVibes: ["Forest Wonderland", "Beach Paradise"],
    famousFor: "Outside Lands Music Festival",
  },
  {
    name: "Bayfront Park",
    lat: 25.7743,
    lng: -80.1863,
    description: "Ultra territory",
    longDescription:
      "Hugging the edge of Biscayne Bay in downtown Miami, Bayfront Park is where electronic music meets tropical paradise. The park's waterfront location means bass-heavy beats bounce off the bay while cruise ships and yachts drift past in the background. Palm trees line the grounds, the air is warm and salty, and the Miami skyline towers overhead, creating a uniquely glamorous festival setting that feels more like a scene from a music video than real life.",
    capacity: "55,000",
    terrain: "Oceanfront urban park",
    bestVibes: ["Urban Jungle", "Beach Paradise"],
    famousFor: "Ultra Music Festival",
  },
  {
    name: "Grant Park",
    lat: 41.8827,
    lng: -87.6233,
    description: "Lollapalooza grounds",
    longDescription:
      "Chicago's front yard stretches along the Lake Michigan shoreline with the city's legendary skyline rising directly behind the main stages. Grant Park during Lollapalooza is an electrifying collision of world-class architecture, lakefront breezes, and pure big-city festival chaos. The Buckingham Fountain anchors the grounds, stages spread across manicured lawns, and at night the city lights transform the park into a glowing urban amphitheater unlike anything else in the festival world.",
    capacity: "100,000",
    terrain: "Lakefront urban park",
    bestVibes: ["Urban Jungle"],
    famousFor: "Lollapalooza",
  },
  {
    name: "Manchester Farm",
    lat: 35.4834,
    lng: -86.0589,
    description: "Bonnaroo country",
    longDescription:
      "A 700-acre farm in rural Coffee County, Tennessee, Manchester Farm becomes its own temporary city every June when Bonnaroo takes over. The rolling fields and scattered tree groves create a communal camping atmosphere that has earned it a reputation as the friendliest festival in America. The famous arch entrance, hand-painted signs, and dusty farm roads give it an unmistakable DIY charm, while the sheer remoteness means there is nowhere to go but deeper into the music and the community.",
    capacity: "80,000",
    terrain: "Rolling farmland",
    bestVibes: ["Forest Wonderland", "Desert Oasis"],
    famousFor: "Bonnaroo Music and Arts Festival",
  },
  {
    name: "Las Vegas Motor Speedway",
    lat: 36.272,
    lng: -115.0107,
    description: "EDC Las Vegas home",
    longDescription:
      "A massive motorsport complex on the outskirts of Las Vegas, the Speedway transforms into a neon wonderland for Electric Daisy Carnival. The flat, open desert terrain gives production designers a blank canvas to build towering stage structures, carnival rides, and art installations that stretch to the horizon. The festival runs from dusk till dawn, and the desert heat gives way to cool night air as hundreds of thousands of ravers dance under a canopy of lasers, fireworks, and stars.",
    capacity: "170,000",
    terrain: "Desert speedway",
    bestVibes: ["Desert Oasis", "Urban Jungle"],
    famousFor: "Electric Daisy Carnival (EDC) Las Vegas",
  },
  {
    name: "Huntington Beach",
    lat: 33.6595,
    lng: -117.9988,
    description: "Surf City USA",
    longDescription:
      "Known as Surf City USA, Huntington Beach offers a laid-back Southern California festival experience where the Pacific Ocean is both the backdrop and the main attraction. Stages set up along the beachfront mean you can feel the sand between your toes while watching your favorite artists, and the sound of crashing waves blends seamlessly with the music. The iconic Huntington Beach Pier stretches into the ocean nearby, surfers catch waves just beyond the crowd, and the salty ocean breeze keeps the vibes impossibly chill.",
    capacity: "50,000",
    terrain: "Beachfront",
    bestVibes: ["Beach Paradise"],
    famousFor: "US Open of Surfing and beachfront concerts",
  },
]
