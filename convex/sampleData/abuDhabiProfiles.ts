export interface DemoRouteStop {
  location: string;
  latitude: number;
  longitude: number;
  startDate: number;
  endDate: number;
}

export interface DemoProfile {
  name: string;
  age: number;
  dateOfBirth: number;
  gender: "man" | "woman" | "non-binary";
  bio: string;
  lookingFor: ("Dating" | "Friends" | "Van Help")[];
  interests: string[];
  photos: string[];
  vanType: string;
  vanBuildStatus: string;
  location: { latitude: number; longitude: number };
  currentRoute: DemoRouteStop[];
  verified: boolean;
}

function ageToDateOfBirth(age: number): number {
  const now = new Date();
  const birthYear = now.getFullYear() - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day).getTime();
}

function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

const abuDhabiDowntown = { latitude: 24.4539, longitude: 54.3773 };
const corniche = { latitude: 24.4764, longitude: 54.3233 };
const yasisland = { latitude: 24.4672, longitude: 54.6031 };
const saadiyat = { latitude: 24.5465, longitude: 54.4343 };
const abuDhabiDesert = { latitude: 24.2134, longitude: 55.7489 };

const dubaiMarina = { latitude: 25.0804, longitude: 55.1403 };
const dubaiDowntown = { latitude: 25.1972, longitude: 55.2744 };
const jumeirahBeach = { latitude: 25.2048, longitude: 55.2708 };
const alQuoz = { latitude: 25.1343, longitude: 55.2318 };

const sharjahCorniche = { latitude: 25.3573, longitude: 55.3898 };
const rasAlKhaimah = { latitude: 25.7889, longitude: 55.9432 };
const fujairah = { latitude: 25.1288, longitude: 56.3265 };
const alAin = { latitude: 24.2075, longitude: 55.7447 };

const liwaOasis = { latitude: 23.1331, longitude: 53.7644 };
const hajarMountains = { latitude: 25.9333, longitude: 56.1167 };
const emptyQuarter = { latitude: 23.4241, longitude: 53.8478 };

export const abuDhabiProfiles: DemoProfile[] = [
  {
    name: "Layla",
    age: 28,
    dateOfBirth: ageToDateOfBirth(28),
    gender: "woman",
    bio: "Full-time van lifer documenting the Middle East. Currently exploring UAE's hidden gems. Love sunrise desert drives and finding the best shawarma spots. Looking for fellow adventurers to explore with!",
    lookingFor: ["Dating", "Friends"],
    interests: ["Photography", "Hiking", "Cooking", "Travel", "Surfing", "Yoga"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: abuDhabiDowntown,
    verified: true,
    currentRoute: [
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(0),
        endDate: daysFromNow(7),
      },
      {
        location: "Dubai Marina",
        ...dubaiMarina,
        startDate: daysFromNow(7),
        endDate: daysFromNow(14),
      },
      {
        location: "Fujairah Coast",
        ...fujairah,
        startDate: daysFromNow(14),
        endDate: daysFromNow(21),
      },
    ],
  },
  {
    name: "Zara",
    age: 26,
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Converted my ProMaster into a mobile art studio. Currently parked near Saadiyat beach working on my next collection. Love morning surf sessions and campfire cooking. Seeking creative souls!",
    lookingFor: ["Dating", "Friends", "Van Help"],
    interests: ["Surfing", "Art", "Cooking", "Photography", "Beach", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&fit=crop",
    ],
    vanType: "ProMaster",
    vanBuildStatus: "Living full-time",
    location: saadiyat,
    verified: true,
    currentRoute: [
      {
        location: "Saadiyat Island",
        ...saadiyat,
        startDate: daysFromNow(-3),
        endDate: daysFromNow(10),
      },
      {
        location: "Ras Al Khaimah",
        ...rasAlKhaimah,
        startDate: daysFromNow(10),
        endDate: daysFromNow(17),
      },
    ],
  },
  {
    name: "Noor",
    age: 27,
    dateOfBirth: ageToDateOfBirth(27),
    gender: "woman",
    bio: "UAE local who ditched the apartment for van life! Exploring my own backyard and loving it. Expert on the best hidden spots in Abu Dhabi. Happy to show newcomers around!",
    lookingFor: ["Dating", "Friends"],
    interests: ["Hiking", "Photography", "Coffee", "Fitness", "Travel", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: yasisland,
    verified: true,
    currentRoute: [
      {
        location: "Yas Island",
        ...yasisland,
        startDate: daysFromNow(-5),
        endDate: daysFromNow(5),
      },
      {
        location: "Al Ain Oasis",
        ...alAin,
        startDate: daysFromNow(5),
        endDate: daysFromNow(12),
      },
      {
        location: "Liwa Desert",
        ...liwaOasis,
        startDate: daysFromNow(12),
        endDate: daysFromNow(19),
      },
    ],
  },
  {
    name: "Sofia",
    age: 29,
    dateOfBirth: ageToDateOfBirth(29),
    gender: "woman",
    bio: "European van lifer on a Middle East tour. Just arrived in UAE and already in love! Rock climbing, desert camping, and searching for the best sunset spots. Let's explore together!",
    lookingFor: ["Dating", "Friends"],
    interests: ["Rock Climbing", "Hiking", "Photography", "Camping", "Travel", "Yoga"],
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&q=80&fit=crop",
    ],
    vanType: "Transit",
    vanBuildStatus: "Living full-time",
    location: dubaiMarina,
    verified: false,
    currentRoute: [
      {
        location: "Dubai Marina",
        ...dubaiMarina,
        startDate: daysFromNow(-2),
        endDate: daysFromNow(8),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(8),
        endDate: daysFromNow(15),
      },
      {
        location: "Hajar Mountains",
        ...hajarMountains,
        startDate: daysFromNow(15),
        endDate: daysFromNow(22),
      },
    ],
  },
  {
    name: "Amira",
    age: 25,
    dateOfBirth: ageToDateOfBirth(25),
    gender: "woman",
    bio: "Building my van while living in Abu Dhabi. Weekend warrior turning into full-timer! Looking for build advice, adventure buddies, and maybe something more. Electrical expertise welcome!",
    lookingFor: ["Van Help", "Friends", "Dating"],
    interests: ["Camping", "Fitness", "Music", "Coffee", "Beach", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&fit=crop",
    ],
    vanType: "Transit",
    vanBuildStatus: "Currently building",
    location: abuDhabiDowntown,
    verified: true,
    currentRoute: [
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(0),
        endDate: daysFromNow(14),
      },
    ],
  },
  {
    name: "Emma",
    age: 29,
    dateOfBirth: ageToDateOfBirth(29),
    gender: "woman",
    bio: "British expat who fell in love with UAE and bought a van! Work remotely as a content writer. Love yoga, healthy cooking, and finding quiet beaches. Looking for like-minded souls!",
    lookingFor: ["Dating", "Friends"],
    interests: ["Yoga", "Cooking", "Writing", "Beach", "Coffee", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&fit=crop",
    ],
    vanType: "Transit",
    vanBuildStatus: "Living full-time",
    location: corniche,
    verified: true,
    currentRoute: [
      {
        location: "Abu Dhabi Corniche",
        ...corniche,
        startDate: daysFromNow(0),
        endDate: daysFromNow(10),
      },
      {
        location: "Saadiyat Island",
        ...saadiyat,
        startDate: daysFromNow(10),
        endDate: daysFromNow(17),
      },
    ],
  },
  {
    name: "Fatima",
    age: 24,
    dateOfBirth: ageToDateOfBirth(24),
    gender: "woman",
    bio: "First Emirati woman to go full-time van life! Breaking stereotypes one adventure at a time. Love mountain biking, traditional crafts, and inspiring other women to chase their dreams.",
    lookingFor: ["Friends", "Dating"],
    interests: ["Mountain Biking", "Hiking", "Crafts", "Photography", "Camping", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: rasAlKhaimah,
    verified: true,
    currentRoute: [
      {
        location: "Ras Al Khaimah",
        ...rasAlKhaimah,
        startDate: daysFromNow(-2),
        endDate: daysFromNow(8),
      },
      {
        location: "Fujairah",
        ...fujairah,
        startDate: daysFromNow(8),
        endDate: daysFromNow(15),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(15),
        endDate: daysFromNow(22),
      },
    ],
  },
  {
    name: "Yasmin",
    age: 26,
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Lebanese artist living in my mobile studio. Paint desert landscapes and teach workshops from my van. Love meditation, incense, and deep conversations about life. Seeking genuine connections!",
    lookingFor: ["Dating", "Friends"],
    interests: ["Art", "Painting", "Meditation", "Yoga", "Nature", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1551292831-023188e78222?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&q=80&fit=crop",
    ],
    vanType: "ProMaster",
    vanBuildStatus: "Living full-time",
    location: liwaOasis,
    verified: true,
    currentRoute: [
      {
        location: "Liwa Oasis",
        ...liwaOasis,
        startDate: daysFromNow(-4),
        endDate: daysFromNow(9),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(9),
        endDate: daysFromNow(16),
      },
    ],
  },
  {
    name: "Omar",
    age: 30,
    dateOfBirth: ageToDateOfBirth(30),
    gender: "man",
    bio: "Solar-powered Sprinter cruising the emirates. Electrician by trade, desert explorer by passion. Can help with van builds! Love kitesurfing, dune bashing, and stargazing in the Empty Quarter.",
    lookingFor: ["Dating", "Friends", "Van Help"],
    interests: ["Kitesurfing", "Camping", "Solar Power", "Hiking", "Photography", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: dubaiMarina,
    verified: true,
    currentRoute: [
      {
        location: "Dubai Marina",
        ...dubaiMarina,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(6),
      },
      {
        location: "Abu Dhabi Corniche",
        ...corniche,
        startDate: daysFromNow(6),
        endDate: daysFromNow(13),
      },
      {
        location: "Empty Quarter",
        ...emptyQuarter,
        startDate: daysFromNow(13),
        endDate: daysFromNow(20),
      },
    ],
  },
  {
    name: "Jake",
    age: 28,
    dateOfBirth: ageToDateOfBirth(28),
    gender: "man",
    bio: "Australian traveling the world in my self-built Sprinter. UAE is stop #47! Love finding local coffee shops, meeting new people, and sharing van build tips. Always down for a beach day!",
    lookingFor: ["Friends", "Dating"],
    interests: ["Surfing", "Coffee", "Travel", "Photography", "Music", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: jumeirahBeach,
    verified: true,
    currentRoute: [
      {
        location: "Jumeirah Beach",
        ...jumeirahBeach,
        startDate: daysFromNow(0),
        endDate: daysFromNow(7),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(7),
        endDate: daysFromNow(14),
      },
      {
        location: "Fujairah",
        ...fujairah,
        startDate: daysFromNow(14),
        endDate: daysFromNow(21),
      },
    ],
  },
  {
    name: "Rashid",
    age: 26,
    dateOfBirth: ageToDateOfBirth(26),
    gender: "man",
    bio: "UAE local teaching others about desert survival and van camping. Know all the best wild camping spots! Love rock climbing, traditional Emirati cooking, and sharing stories under the stars.",
    lookingFor: ["Friends", "Van Help"],
    interests: ["Rock Climbing", "Camping", "Cooking", "Hiking", "Photography", "Stargazing"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&q=80&fit=crop",
    ],
    vanType: "Land Cruiser (Modified)",
    vanBuildStatus: "Living full-time",
    location: abuDhabiDesert,
    verified: true,
    currentRoute: [
      {
        location: "Abu Dhabi Desert",
        ...abuDhabiDesert,
        startDate: daysFromNow(-3),
        endDate: daysFromNow(10),
      },
      {
        location: "Hajar Mountains",
        ...hajarMountains,
        startDate: daysFromNow(10),
        endDate: daysFromNow(17),
      },
    ],
  },
  {
    name: "Marco",
    age: 31,
    dateOfBirth: ageToDateOfBirth(31),
    gender: "man",
    bio: "Italian photographer documenting van life across continents. UAE leg of my 2-year journey! Love drone photography, finding unique perspectives, and cooking Italian meals in my van kitchen.",
    lookingFor: ["Dating", "Friends"],
    interests: ["Photography", "Drones", "Cooking", "Travel", "Art", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=800&q=80&fit=crop",
    ],
    vanType: "ProMaster",
    vanBuildStatus: "Living full-time",
    location: dubaiDowntown,
    verified: false,
    currentRoute: [
      {
        location: "Dubai Downtown",
        ...dubaiDowntown,
        startDate: daysFromNow(0),
        endDate: daysFromNow(9),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(9),
        endDate: daysFromNow(16),
      },
      {
        location: "Liwa Oasis",
        ...liwaOasis,
        startDate: daysFromNow(16),
        endDate: daysFromNow(23),
      },
    ],
  },
  {
    name: "Hassan",
    age: 27,
    dateOfBirth: ageToDateOfBirth(27),
    gender: "man",
    bio: "Mechanical engineer who left corporate to build custom vans. Happy to help with mechanical issues! Currently working on solar setups. Love desert camping and sharing technical knowledge.",
    lookingFor: ["Van Help", "Friends"],
    interests: ["Mechanics", "Solar Power", "Camping", "Hiking", "Coffee", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: alQuoz,
    verified: true,
    currentRoute: [
      {
        location: "Al Quoz (Dubai)",
        ...alQuoz,
        startDate: daysFromNow(-5),
        endDate: daysFromNow(7),
      },
      {
        location: "Abu Dhabi",
        ...abuDhabiDowntown,
        startDate: daysFromNow(7),
        endDate: daysFromNow(14),
      },
    ],
  },
  {
    name: "Alex",
    age: 32,
    dateOfBirth: ageToDateOfBirth(32),
    gender: "man",
    bio: "Canadian nomad exploring Asia and Middle East. Expert at finding free camping spots! Love mountain hiking, wildlife photography, and trading van build knowledge. Always down to help others!",
    lookingFor: ["Friends", "Van Help"],
    interests: ["Hiking", "Wildlife", "Photography", "Camping", "Travel", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
    ],
    vanType: "Sprinter",
    vanBuildStatus: "Living full-time",
    location: hajarMountains,
    verified: false,
    currentRoute: [
      {
        location: "Hajar Mountains",
        ...hajarMountains,
        startDate: daysFromNow(0),
        endDate: daysFromNow(11),
      },
      {
        location: "Fujairah",
        ...fujairah,
        startDate: daysFromNow(11),
        endDate: daysFromNow(18),
      },
      {
        location: "Dubai",
        ...dubaiDowntown,
        startDate: daysFromNow(18),
        endDate: daysFromNow(25),
      },
    ],
  },
  {
    name: "David",
    age: 29,
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "American fitness coach traveling the world. Outdoor workouts, healthy meal prep, and beach runs are my thing. Looking for workout buddies and adventure partners. Let's stay fit together!",
    lookingFor: ["Friends", "Dating"],
    interests: ["Fitness", "Cooking", "Beach", "Running", "Yoga", "Camping"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
    ],
    vanType: "Transit",
    vanBuildStatus: "Living full-time",
    location: jumeirahBeach,
    verified: true,
    currentRoute: [
      {
        location: "Jumeirah Beach",
        ...jumeirahBeach,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(9),
      },
      {
        location: "Abu Dhabi Corniche",
        ...corniche,
        startDate: daysFromNow(9),
        endDate: daysFromNow(16),
      },
    ],
  },
];

export default abuDhabiProfiles;
