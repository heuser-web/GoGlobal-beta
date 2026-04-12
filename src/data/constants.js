export const CITIES = [
  { name: "Las Vegas", state: "Nevada", tagline: "The Entertainment Capital", icon: "🎰", color: "#FF2D55", accent: "#C9A84C", region: "West", live: true },
  { name: "New York", state: "New York", tagline: "The City That Never Sleeps", icon: "🗽", color: "#5E5CE6", accent: "#64D2FF", region: "East" },
  { name: "Los Angeles", state: "California", tagline: "City of Angels", icon: "🌴", color: "#FF9F0A", accent: "#FFD60A", region: "West" },
  { name: "Miami", state: "Florida", tagline: "The Magic City", icon: "🌊", color: "#64D2FF", accent: "#5E5CE6", region: "East" },
  { name: "Chicago", state: "Illinois", tagline: "The Windy City", icon: "🏙️", color: "#30D158", accent: "#64D2FF", region: "Midwest" },
  { name: "Nashville", state: "Tennessee", tagline: "Music City", icon: "🎵", color: "#BF5AF2", accent: "#FF375F", region: "South" },
  { name: "Austin", state: "Texas", tagline: "Keep It Weird", icon: "🤠", color: "#30D158", accent: "#FFD60A", region: "South" },
  { name: "San Francisco", state: "California", tagline: "The Golden Gate City", icon: "🌉", color: "#FF2D55", accent: "#FF9F0A", region: "West" },
  { name: "New Orleans", state: "Louisiana", tagline: "The Big Easy", icon: "⚜️", color: "#C9A84C", accent: "#FF2D55", region: "South" },
  { name: "Denver", state: "Colorado", tagline: "The Mile High City", icon: "🏔️", color: "#5E5CE6", accent: "#64D2FF", region: "West" },
  { name: "Seattle", state: "Washington", tagline: "The Emerald City", icon: "☕", color: "#30D158", accent: "#5E5CE6", region: "West" },
  { name: "Honolulu", state: "Hawaii", tagline: "The Crossroads of the Pacific", icon: "🌺", color: "#FF375F", accent: "#FFD60A", region: "West" },
];
export const VEGAS_HIKES = [
  {
    id: "hike-1", name: "Red Rock Canyon - Calico Tanks", difficulty: "Moderate", distance: "2.5 mi", elevation: "450 ft",
    description: "Scramble through red sandstone to a natural water tank with Strip views.", tags: ["Scenic", "Scramble"],
    elevationProfile: [{d:0,e:3900},{d:0.3,e:4020},{d:0.6,e:4150},{d:0.9,e:4240},{d:1.2,e:4290},{d:1.5,e:4350},{d:1.8,e:4200},{d:2.1,e:4050},{d:2.5,e:3900}]
  },
  {
    id: "hike-2", name: "Valley of Fire - Fire Wave Trail", difficulty: "Easy", distance: "1.5 mi", elevation: "100 ft",
    description: "Walk through psychedelic striped sandstone formations in Nevada's oldest park.", tags: ["Family", "Photography"],
    elevationProfile: [{d:0,e:1700},{d:0.25,e:1720},{d:0.5,e:1740},{d:0.75,e:1760},{d:1.0,e:1780},{d:1.25,e:1770},{d:1.5,e:1800}]
  },
  {
    id: "hike-3", name: "Mount Charleston - Mary Jane Falls", difficulty: "Moderate", distance: "3 mi", elevation: "1,000 ft",
    description: "Escape the heat in alpine forest to a seasonal 50-foot waterfall.", tags: ["Waterfall", "Cool Temps"],
    elevationProfile: [{d:0,e:7700},{d:0.4,e:7950},{d:0.8,e:8200},{d:1.2,e:8450},{d:1.5,e:8700},{d:1.8,e:8500},{d:2.2,e:8300},{d:2.6,e:8100},{d:3.0,e:7700}]
  },
  {
    id: "hike-4", name: "Gold Strike Hot Springs", difficulty: "Hard", distance: "6 mi", elevation: "900 ft",
    description: "A thrilling slot canyon descent with rope assists to natural hot springs.", tags: ["Hot Springs", "Adventure"],
    elevationProfile: [{d:0,e:1800},{d:0.5,e:1700},{d:1.0,e:1550},{d:1.5,e:1400},{d:2.0,e:1250},{d:2.5,e:1100},{d:3.0,e:950},{d:3.5,e:900},{d:4.0,e:1000},{d:4.5,e:1200},{d:5.0,e:1500},{d:5.5,e:1650},{d:6.0,e:1800}]
  },
  {
    id: "hike-5", name: "Historic Railroad Trail", difficulty: "Easy", distance: "7.5 mi", elevation: "Flat",
    description: "Walk through tunnels carved from rock on the old rail line at Lake Mead.", tags: ["Historical", "Flat"],
    elevationProfile: [{d:0,e:1200},{d:1.0,e:1210},{d:2.0,e:1205},{d:3.0,e:1215},{d:4.0,e:1200},{d:5.0,e:1210},{d:6.0,e:1205},{d:7.0,e:1200},{d:7.5,e:1200}]
  },
  {
    id: "hike-6", name: "Kraft Mountain Loop", difficulty: "Moderate", distance: "6 mi", elevation: "800 ft",
    description: "An off-the-beaten-path loop through rugged terrain in Calico Basin.", tags: ["Solitude", "Loop"],
    elevationProfile: [{d:0,e:3200},{d:0.6,e:3400},{d:1.2,e:3650},{d:1.8,e:3900},{d:2.4,e:4000},{d:3.0,e:3850},{d:3.6,e:3700},{d:4.2,e:3550},{d:4.8,e:3400},{d:5.4,e:3300},{d:6.0,e:3200}]
  },
  {
    id: "hike-7", name: "Red Rock Canyon - Ice Box Canyon", difficulty: "Moderate", distance: "2.6 mi", elevation: "600 ft",
    description: "A shaded canyon hike ending at seasonal waterfalls hidden in the red rock walls.", tags: ["Waterfall", "Shaded"],
    elevationProfile: [{d:0,e:3700},{d:0.4,e:3850},{d:0.8,e:4050},{d:1.3,e:4250},{d:1.6,e:4300},{d:2.0,e:4100},{d:2.3,e:3900},{d:2.6,e:3700}]
  },
  {
    id: "hike-8", name: "Mount Charleston - Cathedral Rock Trail", difficulty: "Hard", distance: "5.5 mi", elevation: "2,300 ft",
    description: "A steep alpine climb to panoramic views at 8,500 feet — the best escape from desert heat.", tags: ["Summit", "Views"],
    elevationProfile: [{d:0,e:7500},{d:0.6,e:7800},{d:1.2,e:8200},{d:1.8,e:8600},{d:2.4,e:9000},{d:2.75,e:9400},{d:3.2,e:9000},{d:3.8,e:8500},{d:4.4,e:8000},{d:5.0,e:7700},{d:5.5,e:7500}]
  },
  {
    id: "hike-9", name: "Valley of Fire - White Domes Loop", difficulty: "Easy", distance: "1.1 mi", elevation: "80 ft",
    description: "A short loop through slot canyons, old movie ruins, and wildly colored sandstone domes.", tags: ["Family", "Loop"],
    elevationProfile: [{d:0,e:1850},{d:0.2,e:1870},{d:0.4,e:1880},{d:0.6,e:1860},{d:0.8,e:1855},{d:1.0,e:1845},{d:1.1,e:1850}]
  },
  {
    id: "hike-10", name: "Lake Mead - River Mountains Loop", difficulty: "Moderate", distance: "35 mi", elevation: "3,200 ft",
    description: "Epic multi-use trail circling the River Mountains with stunning Mead reservoir views.", tags: ["Epic", "Bike-Friendly"],
    elevationProfile: [{d:0,e:1600},{d:4,e:2200},{d:8,e:2800},{d:12,e:3100},{d:17,e:2900},{d:22,e:2400},{d:27,e:2000},{d:31,e:1800},{d:35,e:1600}]
  },
  {
    id: "hike-11", name: "Calico Hills - Calico Basin Red Spring", difficulty: "Easy", distance: "1.0 mi", elevation: "150 ft",
    description: "A short stroll past a desert spring and wetland oasis at the base of glowing red hills.", tags: ["Family", "Wildlife"],
    elevationProfile: [{d:0,e:2800},{d:0.2,e:2850},{d:0.4,e:2900},{d:0.6,e:2950},{d:0.8,e:2920},{d:1.0,e:2800}]
  },
  {
    id: "hike-12", name: "Red Rock Canyon - La Madre Spring", difficulty: "Moderate", distance: "10.5 mi", elevation: "1,200 ft",
    description: "A long backcountry traverse to a shaded spring hidden in the limestone escarpment.", tags: ["Backcountry", "Spring"],
    elevationProfile: [{d:0,e:3500},{d:1.5,e:3800},{d:3.0,e:4200},{d:4.5,e:4700},{d:5.25,e:4950},{d:6.0,e:4700},{d:7.5,e:4200},{d:9.0,e:3800},{d:10.5,e:3500}]
  },
  {
    id: "hike-13", name: "Sloan Canyon Petroglyph Site", difficulty: "Easy", distance: "4 mi", elevation: "200 ft",
    description: "Desert wash hike to a concentration of over 300 ancient Native American petroglyphs.", tags: ["Cultural", "Desert"],
    elevationProfile: [{d:0,e:2800},{d:0.5,e:2840},{d:1.0,e:2870},{d:1.5,e:2900},{d:2.0,e:2950},{d:2.5,e:2920},{d:3.0,e:2900},{d:3.5,e:2860},{d:4.0,e:2800}]
  },
  {
    id: "hike-14", name: "Mount Charleston - Charleston Peak Summit", difficulty: "Hard", distance: "10.2 mi", elevation: "4,200 ft",
    description: "The king of Vegas hikes — summit Nevada's 11,918-ft peak with jaw-dropping Great Basin views.", tags: ["Summit", "Bucket List"],
    elevationProfile: [{d:0,e:7700},{d:1.0,e:8300},{d:2.0,e:9000},{d:3.0,e:9700},{d:4.0,e:10400},{d:5.1,e:11918},{d:6.2,e:10400},{d:7.2,e:9700},{d:8.2,e:9000},{d:9.2,e:8300},{d:10.2,e:7700}]
  },
  {
    id: "hike-15", name: "Valley of Fire - Rainbow Vista Trail", difficulty: "Easy", distance: "1.0 mi", elevation: "60 ft",
    description: "Stroll across multi-hued sandstone with fire-orange, pink, and purple layered formations.", tags: ["Photography", "Panoramic"],
    elevationProfile: [{d:0,e:1900},{d:0.2,e:1920},{d:0.4,e:1930},{d:0.6,e:1925},{d:0.8,e:1915},{d:1.0,e:1900}]
  },
  {
    id: "hike-16", name: "Lake Mead - Lakeshore Trail", difficulty: "Easy", distance: "9 mi", elevation: "500 ft",
    description: "Wind along rugged desert shoreline above the turquoise waters of Lake Mead.", tags: ["Lake Views", "Flat"],
    elevationProfile: [{d:0,e:1200},{d:1.0,e:1250},{d:2.0,e:1280},{d:3.0,e:1310},{d:4.0,e:1350},{d:5.0,e:1380},{d:6.0,e:1350},{d:7.0,e:1300},{d:8.0,e:1250},{d:9.0,e:1200}]
  },
  {
    id: "hike-17", name: "Red Rock Canyon - Pine Creek Canyon", difficulty: "Moderate", distance: "3.6 mi", elevation: "500 ft",
    description: "Descend into a lush canyon with a seasonal creek, ponderosa pines, and towering red walls.", tags: ["Canyon", "Shaded"],
    elevationProfile: [{d:0,e:4100},{d:0.5,e:4000},{d:1.0,e:3900},{d:1.5,e:3800},{d:1.8,e:3750},{d:2.3,e:3850},{d:2.8,e:3950},{d:3.2,e:4050},{d:3.6,e:4100}]
  },
  {
    id: "hike-18", name: "Wetlands Park Nature Preserve", difficulty: "Easy", distance: "3 mi", elevation: "Flat",
    description: "An urban oasis — 2,900-acre wetlands with bird-watching boardwalks just 15 min from the Strip.", tags: ["Bird Watching", "Urban"],
    elevationProfile: [{d:0,e:1800},{d:0.5,e:1805},{d:1.0,e:1802},{d:1.5,e:1808},{d:2.0,e:1803},{d:2.5,e:1806},{d:3.0,e:1800}]
  },
  {
    id: "hike-19", name: "Logandale Trails System", difficulty: "Moderate", distance: "8 mi", elevation: "600 ft",
    description: "Remote desert trails through volcanic rock, valley views, and near-total solitude.", tags: ["Solitude", "Desert"],
    elevationProfile: [{d:0,e:1600},{d:1.0,e:1750},{d:2.0,e:1900},{d:3.0,e:2050},{d:4.0,e:2200},{d:5.0,e:2050},{d:6.0,e:1900},{d:7.0,e:1750},{d:8.0,e:1600}]
  },
  {
    id: "hike-20", name: "Black Mountain - Henderson", difficulty: "Hard", distance: "5.5 mi", elevation: "1,500 ft",
    description: "A steep rocky scramble to the summit of Black Mountain for 360° views of Vegas and Lake Mead.", tags: ["Summit", "Scramble"],
    elevationProfile: [{d:0,e:2700},{d:0.6,e:3000},{d:1.2,e:3400},{d:1.8,e:3800},{d:2.4,e:4200},{d:2.75,e:4500},{d:3.2,e:4200},{d:3.8,e:3800},{d:4.4,e:3300},{d:5.0,e:2900},{d:5.5,e:2700}]
  },
];

export const VEGAS_GEMS = [
  { id: "gem-1", name: "The Neon Museum", category: "Culture", description: "A graveyard of iconic vintage casino signs from Vegas history." },
  { id: "gem-2", name: "Omega Mart at Area 15", category: "Experience", description: "A mind-bending immersive art installation disguised as a grocery store." },
  { id: "gem-3", name: "Pinball Hall of Fame", category: "Fun", description: "Thousands of playable vintage pinball machines spanning decades." },
  { id: "gem-4", name: "Springs Preserve", category: "Nature", description: "A 180-acre nature oasis with desert trails, gardens, and wildlife." },
  { id: "gem-5", name: "Fremont East District", category: "Nightlife", description: "The cooler, locals-preferred side of Downtown with craft cocktail bars." },
  { id: "gem-6", name: "Seven Magic Mountains", category: "Art", description: "Towering neon boulder sculptures in the desert south of Vegas." },

  // ── Free Things To Do ─────────────────────────────────────────────────────
  { id: "gem-7",  name: "Fountains of Bellagio", category: "Experience", description: "FREE — 1,200 water jets shoot 460 feet in perfect sync with music and lights. Every 15–30 minutes from 3pm to midnight." },
  { id: "gem-8",  name: "Bellagio Conservatory & Botanical Gardens", category: "Art", description: "FREE — A massive botanical installation inside the Bellagio that changes with every season. Unbelievably detailed and always jaw-dropping." },
  { id: "gem-9",  name: "Chihuly 'Fiori di Como' at Bellagio", category: "Art", description: "FREE — 2,000 hand-blown glass blossoms suspended across Bellagio's lobby ceiling. One of the most stunning glass sculptures in the world." },
  { id: "gem-10", name: "Flamingo Wildlife Habitat", category: "Nature", description: "FREE — Real Chilean flamingos, brown pelicans, koi fish, and turtles living in a lush 4-acre oasis inside the Flamingo casino. Wild to see in person." },
  { id: "gem-11", name: "Fremont Street Experience Light Show", category: "Experience", description: "FREE — A 1,500-foot LED canopy with 16 million pixels puts on a synchronized light and sound show overhead every hour after dark. Don't miss it." },
  { id: "gem-12", name: "Fremont Street Live Music", category: "Nightlife", description: "FREE — Three outdoor stages run live bands every single night. Rock, blues, country, pop — real acts, no cover, just show up." },
  { id: "gem-13", name: "Circus Acts at Circus Circus", category: "Fun", description: "FREE — World-class trapeze artists, jugglers, and aerialists perform above your head daily at 1:30pm weekdays and 11:30am weekends. Genuinely impressive." },
  { id: "gem-14", name: "Lake of Dreams at Wynn", category: "Experience", description: "FREE — A nightly outdoor show featuring 4,000 lights, 40-foot puppets, and holograms projected over a hidden lake. Runs every half hour after dark." },
  { id: "gem-15", name: "Big Elvis at Harrah's", category: "Fun", description: "FREE — Pete Vallee, the self-titled 'Big Elvis,' performs full tribute shows at Harrah's Piano Bar multiple times a week. A Las Vegas legend." },
  { id: "gem-16", name: "Bliss Dance at The Park", category: "Art", description: "FREE — A stunning 40-foot steel sculpture of a dancing woman that glows from within at night. Hidden between T-Mobile Arena and New York-New York." },
  { id: "gem-17", name: "Welcome to Las Vegas Sign", category: "Culture", description: "FREE — The iconic 1959 sign just south of Mandalay Bay. There's a small parking lot — go at sunrise or golden hour for the best shot with no crowds." },
  { id: "gem-18", name: "Downtown Container Park", category: "Experience", description: "FREE to enter — A hip outdoor shopping and dining village built from repurposed shipping containers, anchored by a giant fire-breathing praying mantis sculpture." },
  { id: "gem-19", name: "Cosmopolitan Art & LED Pillars", category: "Art", description: "FREE — Eight 15-foot LED video pillars in the Cosmopolitan lobby put on synchronized light shows throughout the day. The rotating art collection throughout the hotel is legit too." },
  { id: "gem-20", name: "Aria Fine Art Collection", category: "Art", description: "FREE — Works by Maya Lin, Frank Stella, Claes Oldenburg, and Damien Hirst are permanently installed throughout Aria. Better than many paid museums." },
  { id: "gem-21", name: "Haus of Gaga at Park MGM", category: "Art", description: "FREE — An ever-evolving exhibition of Lady Gaga's most iconic costumes, stage sets, and creative work. Wild and genuinely fascinating even if you're not a fan." },
  { id: "gem-22", name: "Fall of Atlantis at Forum Shops", category: "Fun", description: "FREE — Animatronic Roman gods and a full-size Atlantis collapse in dramatic fashion inside Caesars' Forum Shops. Cheesy? Yes. Entertaining? Absolutely." },
  { id: "gem-23", name: "Grand Canal Shoppes at Venetian", category: "Experience", description: "FREE — A quarter-mile indoor replica of Venice with working gondola canals, cobblestone streets, and live opera singers performing as you walk. Stunning architecture." },
  { id: "gem-24", name: "Wynn Botanical Gardens", category: "Nature", description: "FREE — A lush indoor garden oasis inside Wynn with elaborate floral sculptures, butterfly displays, and a carousel. Feels like a different world from the casino floor." },
  { id: "gem-25", name: "M&M's World", category: "Fun", description: "FREE to enter — Four floors of candy madness on the Strip, including a Nascar replica, an M&M Statue of Liberty, and a live-action short film. Kids and adults love it." },
  { id: "gem-26", name: "Luxor Pyramid Atrium", category: "Experience", description: "FREE — Step inside the Luxor and look up — 29 million cubic feet of open space inside a glass pyramid. One of the most unique architectural interiors in the world." },
  { id: "gem-27", name: "Atomic Golf Free Putting", category: "Fun", description: "FREE mini golf — Thursday through Sunday after sunset, the putting course at Atomic Golf opens for free. Glow-in-the-dark, loud music, and great Strip views." },
  { id: "gem-28", name: "Eiffel Tower Light Show at Paris", category: "Experience", description: "FREE — The 540-foot replica Eiffel Tower puts on a choreographed sparkle show every hour after dark that you can watch from the sidewalk. Beautiful against the night sky." },
  { id: "gem-29", name: "Zoox Free Autonomous Taxi Rides", category: "Experience", description: "FREE — Zoox runs complimentary self-driving robotaxi rides between 8 stops on the Strip including Wynn, NYNY, and Resorts World. A glimpse of the future, completely free." },
  { id: "gem-30", name: "18b Las Vegas Arts District", category: "Art", description: "FREE — A walkable neighborhood just southwest of Downtown packed with murals, indie galleries, coffee shops, and studios. First Friday every month turns it into a massive free block party." },
  { id: "gem-31", name: "Bellagio Chocolate Fountain", category: "Fun", description: "FREE — A 14-foot tall chocolate waterfall circulating 2,100 pounds of real chocolate in Bellagio's Patisserie. Absurd and amazing." },
  { id: "gem-32", name: "Old Las Vegas Mormon Fort", category: "Culture", description: "FREE on some days — The oldest surviving building in Nevada, built in 1855 by Mormon settlers. A surprisingly moving piece of Vegas history hidden downtown." },
  { id: "gem-33", name: "Historic Downtown Casino Walk", category: "Culture", description: "FREE — Walk through Binion's, the Golden Nugget, and the Four Queens and you're walking through the original Las Vegas. The architecture, history, and energy are unlike anything on the Strip." },
  { id: "gem-34", name: "Wynn Fountain Show", category: "Experience", description: "FREE — A smaller but elegant water fountain performance runs outside the Wynn resort at regular intervals. Peaceful, beautiful, and almost no one stops to watch it." },
  { id: "gem-35", name: "Fremont Street Street Performers", category: "Fun", description: "FREE — Elaborate costumed characters, human statues, spray-paint artists, and busking musicians line Fremont Street every night. Pure Vegas weirdness at no cost." },
  { id: "gem-36", name: "Vegas Vickie Neon Sign at Circa", category: "Culture", description: "FREE — The iconic 1980 kicking cowgirl neon sign that once lit up Fremont Street is now preserved inside Circa casino. A piece of vintage Vegas saved from demolition." },
  { id: "gem-37", name: "The Park Outdoor Sculpture Garden", category: "Art", description: "FREE — The open-air promenade between T-Mobile Arena and New York-New York is full of art, fountains, and shade trees. A rare calm, beautiful public space on the Strip." },
];

export const VEGAS_EVENTS = [
  { id: "evt-1", artist: "Adele", venue: "The Colosseum at Caesars Palace", dates: ["Apr 11, 2026", "Apr 12, 2026", "Apr 18, 2026", "Apr 19, 2026"], category: "Music", price: "$85+" },
  { id: "evt-2", artist: "Cirque du Soleil: O", venue: "Bellagio", dates: ["Daily except Wed & Thu"], category: "Show", price: "$110+" },
  { id: "evt-3", artist: "Usher", venue: "Park MGM", dates: ["Apr 4, 2026", "Apr 5, 2026", "Apr 11, 2026"], category: "Music", price: "$75+" },
  { id: "evt-4", artist: "Blue Man Group", venue: "Luxor", dates: ["Thu-Mon Weekly"], category: "Show", price: "$60+" },
  { id: "evt-5", artist: "Formula 1 Las Vegas Grand Prix", venue: "Las Vegas Strip Circuit", dates: ["Nov 20-22, 2026"], category: "Sports", price: "$200+" },
  { id: "evt-6", artist: "Adele", venue: "The Colosseum at Caesars Palace", dates: ["Apr 25, 2026", "Apr 26, 2026"], category: "Music", price: "$85+" },
  { id: "evt-7", artist: "Cirque du Soleil: Mystère", venue: "Treasure Island", dates: ["Sat-Wed Weekly"], category: "Show", price: "$80+" },
  { id: "evt-8", artist: "Metallica: M72 World Tour", venue: "Allegiant Stadium", dates: ["May 23, 2026", "May 25, 2026"], category: "Music", price: "$95+" },
  { id: "evt-9", artist: "Metallica: M72 World Tour", venue: "Allegiant Stadium", dates: ["May 30, 2026"], category: "Music", price: "$95+" },
  { id: "evt-10", artist: "David Copperfield", venue: "MGM Grand", dates: ["Nightly 7pm & 9:30pm"], category: "Show", price: "$75+" },
  { id: "evt-11", artist: "Katy Perry: Play", venue: "Resorts World Theatre", dates: ["Apr 17, 2026", "Apr 18, 2026", "Apr 24, 2026"], category: "Music", price: "$89+" },
  { id: "evt-12", artist: "Penn & Teller", venue: "Rio All-Suite Hotel", dates: ["Wed-Sun Weekly"], category: "Show", price: "$55+" },
  { id: "evt-13", artist: "Las Vegas Raiders vs. Kansas City Chiefs", venue: "Allegiant Stadium", dates: ["Sep 13, 2026"], category: "Sports", price: "$120+" },
  { id: "evt-14", artist: "Celine Dion: Farewell Tour", venue: "The Colosseum at Caesars Palace", dates: ["May 2, 2026", "May 3, 2026", "May 9, 2026"], category: "Music", price: "$150+" },
  { id: "evt-15", artist: "Absinthe", venue: "Caesars Palace Spiegeltent", dates: ["Wed-Sun Weekly"], category: "Show", price: "$79+" },
  { id: "evt-16", artist: "Bruno Mars", venue: "Park MGM Dolby Live", dates: ["Apr 10, 2026", "Apr 11, 2026", "Apr 17, 2026"], category: "Music", price: "$95+" },
  { id: "evt-17", artist: "Las Vegas Aces WNBA Season Opener", venue: "Michelob Ultra Arena", dates: ["May 18, 2026"], category: "Sports", price: "$40+" },
  { id: "evt-18", artist: "Mat Franco: Magic Reinvented Nightly", venue: "LINQ Hotel", dates: ["Thu-Mon Weekly"], category: "Show", price: "$49+" },
  { id: "evt-19", artist: "Billie Eilish: Hit Me Hard World Tour", venue: "Allegiant Stadium", dates: ["Jun 6, 2026"], category: "Music", price: "$85+" },
  { id: "evt-20", artist: "Spiegelworld: Atomic Saloon Show", venue: "Grand Canal Shoppes at Venetian", dates: ["Wed-Sun Weekly"], category: "Show", price: "$59+" },
  { id: "evt-21", artist: "Garth Brooks", venue: "Caesars Entertainment Studios", dates: ["May 1, 2026", "May 2, 2026", "May 8, 2026"], category: "Music", price: "$80+" },
  { id: "evt-22", artist: "UFC 312: Main Event Night", venue: "T-Mobile Arena", dates: ["Apr 18, 2026"], category: "Sports", price: "$175+" },
  { id: "evt-23", artist: "Elton John: Farewell Yellow Brick Road", venue: "Allegiant Stadium", dates: ["Jun 20, 2026", "Jun 21, 2026"], category: "Music", price: "$130+" },
  { id: "evt-24", artist: "Shin Lim: Limitless", venue: "Mirage", dates: ["Fri-Tue Weekly"], category: "Show", price: "$65+" },
  { id: "evt-25", artist: "Las Vegas Bowl", venue: "Allegiant Stadium", dates: ["Dec 20, 2026"], category: "Sports", price: "$75+" },
  { id: "evt-26", artist: "The Weeknd: After Hours Til Dawn", venue: "Allegiant Stadium", dates: ["Jul 11, 2026"], category: "Music", price: "$90+" },
  { id: "evt-27", artist: "Legends in Concert", venue: "Flamingo Las Vegas", dates: ["Nightly except Mon"], category: "Show", price: "$45+" },
  { id: "evt-28", artist: "Las Vegas Golden Knights Playoffs", venue: "T-Mobile Arena", dates: ["May 2026 TBD"], category: "Sports", price: "$180+" },
  { id: "evt-29", artist: "Olivia Rodrigo: GUTS World Tour", venue: "Allegiant Stadium", dates: ["Jul 25, 2026"], category: "Music", price: "$75+" },
  { id: "evt-30", artist: "Zumanity by Cirque du Soleil", venue: "New York-New York Hotel", dates: ["Thu-Mon Weekly"], category: "Show", price: "$69+" },
  { id: "evt-31", artist: "Bad Bunny: Most Wanted Tour", venue: "Allegiant Stadium", dates: ["Aug 8, 2026", "Aug 9, 2026"], category: "Music", price: "$110+" },
  { id: "evt-32", artist: "WBC World Championship Boxing", venue: "MGM Grand Garden Arena", dates: ["Apr 25, 2026"], category: "Sports", price: "$150+" },
  { id: "evt-33", artist: "Taylor Swift: The Eras Tour (Extension)", venue: "Allegiant Stadium", dates: ["Oct 3, 2026", "Oct 4, 2026"], category: "Music", price: "$195+" },
  { id: "evt-34", artist: "Carrot Top", venue: "Luxor Hotel", dates: ["Mon, Wed-Sat Weekly"], category: "Show", price: "$40+" },
  { id: "evt-35", artist: "Vegas Neon Art Festival", venue: "The Neon Museum", dates: ["Apr 18-19, 2026"], category: "Art", price: "$25+" },
  { id: "evt-36", artist: "Post Malone", venue: "T-Mobile Arena", dates: ["May 16, 2026"], category: "Music", price: "$85+" },
  { id: "evt-37", artist: "Las Vegas 51s Baseball Opening Day", venue: "Las Vegas Ballpark", dates: ["Apr 9, 2026"], category: "Sports", price: "$20+" },
  { id: "evt-38", artist: "Mystère 30th Anniversary Show", venue: "Treasure Island", dates: ["May 1, 2026", "May 2, 2026"], category: "Show", price: "$90+" },
  { id: "evt-39", artist: "Dua Lipa: Radical Optimism Tour", venue: "T-Mobile Arena", dates: ["Jun 14, 2026"], category: "Music", price: "$80+" },
  { id: "evt-40", artist: "Las Vegas Food & Wine Festival", venue: "Wynn Las Vegas", dates: ["Oct 15-18, 2026"], category: "Food", price: "$95+" },
  { id: "evt-41", artist: "Jennifer Lopez: This Is Me...Now Live", venue: "Resorts World Theatre", dates: ["May 22, 2026", "May 23, 2026"], category: "Music", price: "$100+" },
  { id: "evt-42", artist: "Nathan Burton: Comedy Magic", venue: "Saxe Theater, Planet Hollywood", dates: ["Fri-Sun Weekly"], category: "Show", price: "$30+" },
  { id: "evt-43", artist: "CES Technology Convention", venue: "Las Vegas Convention Center", dates: ["Jan 6-9, 2027"], category: "Tech", price: "$299+" },
  { id: "evt-44", artist: "Harry Styles: Love On Tour", venue: "Allegiant Stadium", dates: ["Aug 22, 2026"], category: "Music", price: "$95+" },
  { id: "evt-45", artist: "Vegas Uncork'd Grand Tasting", venue: "Caesars Palace Gardens", dates: ["May 9-10, 2026"], category: "Food", price: "$125+" },
  { id: "evt-46", artist: "Shania Twain: Come On Over", venue: "Zappos Theater at Planet Hollywood", dates: ["Jun 5, 2026", "Jun 6, 2026"], category: "Music", price: "$70+" },
  { id: "evt-47", artist: "Strip District International Film Festival", venue: "Various Venues", dates: ["Oct 22-25, 2026"], category: "Art", price: "$15+" },
  { id: "evt-48", artist: "Linkin Park: From Zero World Tour", venue: "Allegiant Stadium", dates: ["Sep 5, 2026"], category: "Music", price: "$89+" },
  { id: "evt-49", artist: "Blackjack Ball Invitational", venue: "Palms Casino Resort", dates: ["Jul 18, 2026"], category: "Sports", price: "$500+" },
  { id: "evt-50", artist: "Neon Desert Music Festival", venue: "Downtown Las Vegas Events Center", dates: ["May 30 - Jun 1, 2026"], category: "Music", price: "$65+" },
  { id: "evt-51", artist: "Maroon 5", venue: "Park MGM Dolby Live", dates: ["Jun 19, 2026", "Jun 20, 2026"], category: "Music", price: "$80+" },
  { id: "evt-52", artist: "WrestleMania Weekend", venue: "Allegiant Stadium", dates: ["Apr 3-5, 2026"], category: "Sports", price: "$95+" },
  { id: "evt-53", artist: "Celtic Thunder: Mythology Tour", venue: "Smith Center for the Performing Arts", dates: ["Apr 16, 2026"], category: "Show", price: "$55+" },
  { id: "evt-54", artist: "Las Vegas Jazz & Blues Festival", venue: "Clark County Amphitheater", dates: ["Sep 12-13, 2026"], category: "Music", price: "$40+" },
  { id: "evt-55", artist: "Zedd: #1 DJ World Tour", venue: "Hakkasan Nightclub MGM Grand", dates: ["Apr 25, 2026"], category: "Music", price: "$60+" },
  { id: "evt-56", artist: "Crazy Girls at The Rio", venue: "Rio All-Suite Hotel", dates: ["Thu-Sun Weekly"], category: "Show", price: "$50+" },
  { id: "evt-57", artist: "Nevada Ballet Theatre: Swan Lake", venue: "Smith Center for the Performing Arts", dates: ["May 15-16, 2026"], category: "Art", price: "$45+" },
  { id: "evt-58", artist: "Rod Stewart", venue: "The Colosseum at Caesars Palace", dates: ["Jul 17, 2026", "Jul 18, 2026"], category: "Music", price: "$85+" },
  { id: "evt-59", artist: "PBR Bull Riding World Finals", venue: "T-Mobile Arena", dates: ["Nov 5-8, 2026"], category: "Sports", price: "$85+" },
  { id: "evt-60", artist: "Imagine Dragons: Loom World Tour", venue: "Allegiant Stadium", dates: ["Aug 15, 2026"], category: "Music", price: "$75+" },
  { id: "evt-61", artist: "Vegas Theater Company: Hamilton", venue: "Smith Center for the Performing Arts", dates: ["Jun 9-14, 2026"], category: "Show", price: "$89+" },
  { id: "evt-62", artist: "Electric Daisy Carnival (EDC)", venue: "Las Vegas Motor Speedway", dates: ["May 15-17, 2026"], category: "Music", price: "$150+" },
  { id: "evt-63", artist: "Anthony Joshua vs. Deontay Wilder III", venue: "Allegiant Stadium", dates: ["Jun 27, 2026"], category: "Sports", price: "$250+" },
  { id: "evt-64", artist: "Cher: Classic Cher", venue: "Park MGM Dolby Live", dates: ["Jul 10, 2026", "Jul 11, 2026"], category: "Music", price: "$95+" },
  { id: "evt-65", artist: "Mystix of Vegas Magic Spectacular", venue: "Bally's Las Vegas", dates: ["Fri-Sun Weekly"], category: "Show", price: "$45+" },
  { id: "evt-66", artist: "Las Vegas Restaurant Week", venue: "Citywide", dates: ["Jun 13-22, 2026"], category: "Food", price: "$25+" },
  { id: "evt-67", artist: "SZA: SOS World Tour", venue: "T-Mobile Arena", dates: ["Sep 19, 2026"], category: "Music", price: "$85+" },
  { id: "evt-68", artist: "Art in the Garden Showcase", venue: "Springs Preserve", dates: ["Apr 18-19, 2026"], category: "Art", price: "$15+" },
  { id: "evt-69", artist: "NSYNC: It's Gonna Be Me Reunion Tour", venue: "Allegiant Stadium", dates: ["Jul 30, 2026", "Jul 31, 2026"], category: "Music", price: "$140+" },
  { id: "evt-70", artist: "Las Vegas Marathon", venue: "Las Vegas Strip", dates: ["Nov 29, 2026"], category: "Sports", price: "$110+" },
  { id: "evt-71", artist: "Diplo: Desert Party", venue: "XS Nightclub at Encore", dates: ["May 9, 2026"], category: "Music", price: "$80+" },
  { id: "evt-72", artist: "Vegas Anime & Pop Culture Expo", venue: "Las Vegas Convention Center", dates: ["Aug 1-3, 2026"], category: "Tech", price: "$35+" },
  { id: "evt-73", artist: "Chris Rock: Ego Death World Tour", venue: "Resorts World Theatre", dates: ["Jun 26, 2026", "Jun 27, 2026"], category: "Show", price: "$75+" },
  { id: "evt-74", artist: "Doja Cat: Scarlet Tour", venue: "T-Mobile Arena", dates: ["Oct 9, 2026"], category: "Music", price: "$80+" },
  { id: "evt-75", artist: "Las Vegas International Film Festival", venue: "The Orleans Hotel", dates: ["Oct 8-11, 2026"], category: "Art", price: "$20+" },
  { id: "evt-76", artist: "Kenny Chesney: Sun Goes Down Tour", venue: "Allegiant Stadium", dates: ["Oct 17, 2026"], category: "Music", price: "$75+" },
  { id: "evt-77", artist: "Golden Knights Season Opener", venue: "T-Mobile Arena", dates: ["Oct 10, 2026"], category: "Sports", price: "$95+" },
  { id: "evt-78", artist: "The Greatest Showman Live in Concert", venue: "MGM Grand Garden Arena", dates: ["Nov 7, 2026"], category: "Show", price: "$65+" },
  { id: "evt-79", artist: "Las Vegas Tech Summit", venue: "Wynn Convention Center", dates: ["Sep 23-24, 2026"], category: "Tech", price: "$195+" },
  { id: "evt-80", artist: "Sabrina Carpenter: Short n' Sweet Tour", venue: "Allegiant Stadium", dates: ["Sep 26, 2026"], category: "Music", price: "$80+" },
  { id: "evt-81", artist: "Big 12 Championship Game (Football)", venue: "Allegiant Stadium", dates: ["Dec 5, 2026"], category: "Sports", price: "$100+" },
  { id: "evt-82", artist: "Drag Extravaganza: Rupaul's All Stars Live", venue: "Paris Las Vegas", dates: ["Nov 14-15, 2026"], category: "Show", price: "$70+" },
  { id: "evt-83", artist: "Luke Bryan: Country Forever Tour", venue: "Allegiant Stadium", dates: ["Aug 29, 2026"], category: "Music", price: "$70+" },
  { id: "evt-84", artist: "Vegas Startup Week", venue: "Downtown Las Vegas", dates: ["Oct 5-9, 2026"], category: "Tech", price: "$50+" },
  { id: "evt-85", artist: "Desert Bloom Art Festival", venue: "Fremont East District", dates: ["Apr 25-26, 2026"], category: "Art", price: "$10+" },
  { id: "evt-86", artist: "Lady Gaga: Chromatic Ball", venue: "T-Mobile Arena", dates: ["Nov 21, 2026"], category: "Music", price: "$115+" },
  { id: "evt-87", artist: "NBA All-Star Weekend", venue: "T-Mobile Arena & Allegiant Stadium", dates: ["Feb 13-15, 2027"], category: "Sports", price: "$200+" },
  { id: "evt-88", artist: "Neon Museum Gala & Night Tour", venue: "The Neon Museum", dates: ["Oct 31, 2026"], category: "Art", price: "$65+" },
  { id: "evt-89", artist: "Chefs Table: Vegas Culinary Masters", venue: "Aria Resort & Casino", dates: ["Nov 13-15, 2026"], category: "Food", price: "$250+" },
  { id: "evt-90", artist: "Coldplay: Music of the Spheres", venue: "Allegiant Stadium", dates: ["Aug 2, 2026", "Aug 3, 2026"], category: "Music", price: "$100+" },
  { id: "evt-91", artist: "Las Vegas Beer Festival", venue: "Downtown Container Park", dates: ["Sep 19-20, 2026"], category: "Food", price: "$45+" },
  { id: "evt-92", artist: "Panic! At The Disco: Viva Las Vengeance", venue: "Park MGM Dolby Live", dates: ["Dec 5, 2026", "Dec 6, 2026"], category: "Music", price: "$85+" },
  { id: "evt-93", artist: "NFR: National Finals Rodeo", venue: "Thomas & Mack Center", dates: ["Dec 3-12, 2026"], category: "Sports", price: "$85+" },
  { id: "evt-94", artist: "First Friday Arts Festival", venue: "18b Arts District", dates: ["Monthly First Fridays"], category: "Art", price: "Free" },
  { id: "evt-95", artist: "Snoop Dogg: I Wanna Thank Me Tour", venue: "APEX Social Club Palms", dates: ["Jul 3, 2026", "Jul 4, 2026"], category: "Music", price: "$90+" },
  { id: "evt-96", artist: "Las Vegas Comic-Con", venue: "Las Vegas Convention Center", dates: ["Jun 19-21, 2026"], category: "Tech", price: "$30+" },
  { id: "evt-97", artist: "Celebrity Chef Throwdown", venue: "Cosmopolitan of Las Vegas", dates: ["Nov 8, 2026"], category: "Food", price: "$175+" },
  { id: "evt-98", artist: "Chainsmokers: Setting the Record Straight", venue: "Wynn Nightlife", dates: ["Sep 12, 2026"], category: "Music", price: "$75+" },
  { id: "evt-99", artist: "Red Rock Film Festival", venue: "Red Rock Casino", dates: ["Oct 29 - Nov 1, 2026"], category: "Art", price: "$20+" },
  { id: "evt-100", artist: "New Year's Eve Strip Spectacular", venue: "Las Vegas Strip", dates: ["Dec 31, 2026"], category: "Show", price: "$Free+" },
];

export const ROMANTIC_SURPRISE = [
  { id: "rom-1", time: "4:00 PM", title: "Gondola Ride at The Venetian", type: "Experience", description: "A private gondola serenade through the Grand Canal.", yelpQuery: "Venetian Gondola Rides Las Vegas" },
  { id: "rom-2", time: "6:30 PM", title: "Eiffel Tower Viewing Deck", type: "Attraction", description: "Watch the Bellagio fountains from 460 feet above the Strip.", yelpQuery: "Eiffel Tower Experience Las Vegas" },
  { id: "rom-3", time: "8:00 PM", title: "Dinner at Joël Robuchon", type: "Dining", description: "The only 3-Michelin-star restaurant in Las Vegas.", yelpQuery: "Joel Robuchon MGM Grand Las Vegas" },
  { id: "rom-4", time: "10:30 PM", title: "High Roller Observation Wheel", type: "Experience", description: "A private cabin ride on the world's tallest observation wheel.", yelpQuery: "High Roller Las Vegas" },
];

export const PLATONIC_SURPRISE = [
  { id: "pla-1", time: "10:00 AM", title: "Fly LINQ Zipline", type: "Adventure", description: "Launch 12 stories above the LINQ Promenade at 35 mph.", yelpQuery: "Fly LINQ Zipline Las Vegas" },
  { id: "pla-2", time: "12:30 PM", title: "Secret Pizza at Cosmopolitan", type: "Dining", description: "The hidden speakeasy-style pizza joint with no signage.", yelpQuery: "Secret Pizza Cosmopolitan Las Vegas" },
  { id: "pla-3", time: "2:00 PM", title: "Area 15 + Omega Mart", type: "Experience", description: "An immersive, multi-sensory art and entertainment complex.", yelpQuery: "Area 15 Las Vegas" },
  { id: "pla-4", time: "5:00 PM", title: "TopGolf Las Vegas", type: "Activity", description: "Multi-level driving range with games, food, and Strip views.", yelpQuery: "TopGolf Las Vegas" },
];

// photoSource: 'nps' = National Park Service API (developer.nps.gov)
//              'wiki' = Wikipedia Media API (no key needed — state/BLM parks)
// npsCode: official NPS park code used in the API
// wikiTitle: Wikipedia article title for non-NPS parks
export const NATIONAL_PARKS = [
  {
    id: "np-1", name: "Red Rock Canyon NCA", distance: "20 min", state: "Nevada",
    highlight: "13-mile scenic drive through ancient red sandstone formations",
    description: "Just 17 miles west of the Strip, Red Rock Canyon is Vegas's best-kept secret. Ancient Aztec sandstone formations glow orange and crimson at sunrise and sunset. Over 30 miles of hiking trails, world-class rock climbing, and a stunning 13-mile scenic drive.",
    admission: "Free – $15/vehicle", hours: "Sunrise to sunset daily", bestTime: "Oct – Apr",
    photoSource: "wiki", wikiTitle: "Red Rock Canyon National Conservation Area",
  },
  {
    id: "np-2", name: "Lake Mead NRA", distance: "30 min", state: "Nevada",
    highlight: "America's largest reservoir — swimming, boating & canyon hikes",
    description: "Straddling Nevada and Arizona, Lake Mead National Recreation Area holds America's largest reservoir by volume. The vivid blue-green water against canyon walls is stunning. Hike the Historic Railroad Trail, kayak Emerald Cave, or simply swim at Boulder Beach.",
    admission: "$25/vehicle (7-day pass)", hours: "24 hours / 7 days", bestTime: "Mar – May, Sep – Nov",
    photoSource: "nps", npsCode: "lake",
  },
  {
    id: "np-3", name: "Valley of Fire State Park", distance: "50 min", state: "Nevada",
    highlight: "Nevada's oldest park — fire-red rock formations & 3,000-year-old petroglyphs",
    description: "Nevada's oldest and largest state park earns its name — the landscape blazes red, orange, and violet especially at golden hour. Ancient Atlatl Rock petroglyphs date back 3,000 years. The Fire Wave, White Domes, and Elephant Rock trails are must-dos.",
    admission: "$15 – $20 (Nevada resident/non-resident)", hours: "6am – 8pm", bestTime: "Oct – Apr",
    photoSource: "wiki", wikiTitle: "Valley of Fire State Park",
  },
  {
    id: "np-4", name: "Spring Mountains NRA", distance: "45 min", state: "Nevada",
    highlight: "Mount Charleston — cool alpine forests at 11,918 ft elevation",
    description: "Rise 10,000 feet above the desert floor in under an hour. The Spring Mountains shelter ponderosa pines, limestone peaks, and the rare Spring Mountains checkerbloom flower. Ski Lee Canyon in winter; summit Charleston Peak at 11,918 ft in summer.",
    admission: "Free", hours: "Open year-round", bestTime: "May – Oct for hiking, Dec – Mar for skiing",
    photoSource: "wiki", wikiTitle: "Spring Mountains",
  },
  {
    id: "np-5", name: "Zion National Park", distance: "2.5 hrs", state: "Utah",
    highlight: "The Narrows slot canyon hike — walls 2,000 feet high",
    description: "Zion is the jewel of the Colorado Plateau. Red and white Navajo sandstone towers over emerald rivers. The Narrows is one of the world's greatest hikes — wading upstream through a slot canyon. Angels Landing offers one of the most thrilling summit views anywhere.",
    admission: "$35/vehicle (7-day)", hours: "24 hours / 7 days", bestTime: "Mar – May, Sep – Nov",
    photoSource: "nps", npsCode: "zion",
  },
  {
    id: "np-6", name: "Death Valley National Park", distance: "2 hrs", state: "California",
    highlight: "Badwater Basin — lowest point in North America at -282 ft",
    description: "Death Valley holds records few places can match — hottest air temperature on Earth (134°F), lowest point in North America, and some of the most alien landscapes anywhere. Mesquite Flat Sand Dunes at sunrise, Zabriskie Point at golden hour, and the salt flats of Badwater are iconic.",
    admission: "$30/vehicle (7-day)", hours: "24 hours / 7 days", bestTime: "Oct – Apr",
    photoSource: "nps", npsCode: "deva",
  },
  {
    id: "np-7", name: "Grand Canyon (South Rim)", distance: "4.5 hrs", state: "Arizona",
    highlight: "Bright Angel Trail & world's most iconic geological feature",
    description: "A mile deep, 10 miles wide, and 277 miles long — the Grand Canyon defies description. The South Rim is the most accessible, with the famous Bright Angel and South Kaibab trails descending to the Colorado River. Sunrise from Mather Point is transformative.",
    admission: "$35/vehicle (7-day)", hours: "24 hours / 7 days (visitor center 9am–5pm)", bestTime: "Mar – May, Sep – Nov",
    photoSource: "nps", npsCode: "grca",
  },
  {
    id: "np-8", name: "Mojave National Preserve", distance: "2 hrs", state: "California",
    highlight: "Kelso Dunes, lava tubes & the largest Joshua tree forest",
    description: "Sandwiched between three major desert ecosystems, Mojave Preserve is a place of contrasts. The Kelso Dunes rise 700 feet and hum when the sand slides. Lava Tube Cave stays 35°F year-round. The Cima Dome hosts the world's largest and most dense Joshua tree forest.",
    admission: "Free", hours: "24 hours / 7 days", bestTime: "Oct – May",
    photoSource: "nps", npsCode: "moja",
  },
  {
    id: "np-9", name: "Joshua Tree National Park", distance: "3 hrs", state: "California",
    highlight: "Surreal desert sculptures at the meeting of two ecosystems",
    description: "Where the Mojave and Sonoran deserts meet, a surreal landscape emerges. Twisted Joshua trees frame enormous granite boulder piles. Cholla Cactus Garden glows golden at sunrise. Some of the darkest skies in Southern California make Joshua Tree a legendary stargazing destination.",
    admission: "$35/vehicle (7-day)", hours: "24 hours / 7 days", bestTime: "Oct – May",
    photoSource: "nps", npsCode: "jotr",
  },
  {
    id: "np-10", name: "Bryce Canyon National Park", distance: "4 hrs", state: "Utah",
    highlight: "The world's largest collection of alien-like hoodoo spires",
    description: "Bryce isn't a canyon — it's a series of natural amphitheaters filled with thousands of hoodoo spires in shades of red, orange, white, and purple. Navajo Loop and Queens Garden trails weave through a dreamlike maze. At 8,000–9,100 ft elevation, it's refreshingly cool even in summer.",
    admission: "$35/vehicle (7-day)", hours: "24 hours / 7 days", bestTime: "Apr – Oct",
    photoSource: "nps", npsCode: "brca",
  },
  {
    id: "np-11", name: "Great Basin National Park", distance: "5 hrs", state: "Nevada",
    highlight: "Ancient bristlecone pines, Lehman Caves & Nevada's only glacier",
    description: "Nevada's crown jewel of wilderness. Lehman Caves shelter one of the most decorated cave systems in the US. Wheeler Peak rises to 13,063 ft and shelters a permanent glacier. Ancient bristlecone pine trees here are over 4,000 years old — among the oldest living organisms on Earth.",
    admission: "$0 park entry, $12–$16 cave tour", hours: "24 hours / 7 days", bestTime: "Jun – Sep",
    photoSource: "nps", npsCode: "grba",
  },
  {
    id: "np-12", name: "Grand Staircase-Escalante NM", distance: "4 hrs", state: "Utah",
    highlight: "Slot canyons, petrified wood & the wildest roadless backcountry in the US",
    description: "At 1.7 million acres, Grand Staircase-Escalante is one of the largest national monuments in the US. Slot canyons like Peek-a-boo and Spooky Gulch require permits but reward with other-worldly photography. Petrified wood, dinosaur fossils, and near-zero light pollution.",
    admission: "Free", hours: "24 hours / 7 days", bestTime: "Apr – Jun, Sep – Oct",
    photoSource: "nps", npsCode: "gses",
  },
];

export const ROMEY_PROMPTS = {
  highAdventure: { greeting: "Welcome to GoGlobal. I'm Romey — your concierge for the extraordinary. You've chosen the high-voltage path. Let's map out something worth remembering.", suggestions: ["Best off-road ATV tours", "Where to skydive over the Strip", "Extreme sports packages", "Late-night adrenaline"] },
  intimate: { greeting: "Welcome. I'm Romey — consider me your personal guide to the refined side of Las Vegas. The city has layers most visitors never discover. Shall we?", suggestions: ["Hidden speakeasies", "Best sunset dining", "Private tastings", "Quiet escapes"] },
  default: { greeting: "Good evening. I'm Romey — your GoGlobal concierge. Whether you're chasing a thrill or a quiet corner, I know this city inside out. What's on your mind?", suggestions: ["What's happening tonight", "Where should I eat", "Off-Strip spots", "Hidden gems"] }
};

// ─── Surprise Itinerary Metadata ─────────────────────────────────────────
// Cost estimates and vibe tags for filtering
const ROMANTIC_META = {
  "rom-1": { cost: 110, vibes: ["Romantic", "Luxury"] },
  "rom-2": { cost: 55,  vibes: ["Romantic", "Scenic"] },
  "rom-3": { cost: 350, vibes: ["Luxury", "Fine Dining"] },
  "rom-4": { cost: 60,  vibes: ["Romantic", "Adventurous"] },
};
const PLATONIC_META = {
  "pla-1": { cost: 40, vibes: ["Adventurous", "Thrills"],  age21: false },
  "pla-2": { cost: 20, vibes: ["Cozy", "Low-key"],         age21: false },
  "pla-3": { cost: 50, vibes: ["Adventurous", "Artsy"],    age21: false },
  "pla-4": { cost: 45, vibes: ["Active", "Social"],        age21: false },
  "pla-5": { cost: 55, vibes: ["Nightlife", "Social"],     age21: true  },
  "pla-6": { cost: 65, vibes: ["Luxury", "Views"],         age21: true  },
};
// Extended platonic list — pla-5 and pla-6 are 21+ only
const PLATONIC_EXTENDED = [
  ...PLATONIC_SURPRISE,
  { id: "pla-5", time: "8:00 PM", title: "Herbs & Rye Craft Cocktails", type: "Nightlife",
    description: "Vegas's finest cocktail program inside a dimly lit award-winning speakeasy.", yelpQuery: "Herbs and Rye Las Vegas" },
  { id: "pla-6", time: "10:30 PM", title: "Ghostbar at Palms Casino", type: "Nightlife",
    description: "Outdoor sky lounge 55 floors above the city with unobstructed Vegas panoramas.", yelpQuery: "Ghostbar Palms Casino Las Vegas" },
];
const ROMANCE_VIBES = ["Romantic", "Adventurous", "Cozy", "Luxury", "Low-key", "Spontaneous"];
const SQUAD_VIBES   = ["Adventurous", "Active", "Artsy", "Cozy", "Social", "Low-key"];

export const VEGAS_PHOTOS = {
  hero: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1920&q=85&auto=format",
  strip: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1920&q=85&auto=format",
  neon: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=85&auto=format",
  desert: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=85&auto=format",
  redrock: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1920&q=85&auto=format",
  skyline: "https://images.unsplash.com/photo-1415594445260-63e18261587e?w=1920&q=85&auto=format",
  fountain: "https://images.unsplash.com/photo-1581084324492-c8076f130f86?w=1400&q=85&auto=format",
  night: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1920&q=85&auto=format",
};
