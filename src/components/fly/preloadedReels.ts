import type { Post } from "./types";

/**
 * In-app preloaded reels: shown in the Reels feed alongside real Firebase reels
 * so the feed is never empty and costs no Firestore reads/writes.
 * Ids start with "pre_" — likes/comments/shares on these stay local only.
 */
export const PRELOADED_PREFIX = "pre_";
export const isPreloadedReel = (id: string) => id.startsWith(PRELOADED_PREFIX);

const CREATORS = [
  { id: "rafi", name: "রাফি আহমেদ", user: "rafi.vibes", img: 12 },
  { id: "nusrat", name: "নুসরাত জাহান", user: "nusrat_daily", img: 47 },
  { id: "tanvir", name: "Tanvir Hasan", user: "tanvir.travels", img: 15 },
  { id: "mim", name: "মিম আক্তার", user: "mim.life", img: 44 },
  { id: "arif", name: "Arif Khan", user: "arif_motivation", img: 33 },
  { id: "sadia", name: "সাদিয়া ইসলাম", user: "sadia.art", img: 49 },
  { id: "jisan", name: "Jisan Rahman", user: "jisan.tech", img: 59 },
  { id: "priya", name: "প্রিয়া দাস", user: "priya_moments", img: 45 },
];

const CAPTIONS: [string, string[]][] = [
  ["প্রকৃতির এই সৌন্দর্য মন ভালো করে দেয় 🌿", ["nature", "bangla", "reels"]],
  ["আজকের দিনটা একদম অন্যরকম ছিল ✨", ["lifestyle", "viral", "fyp"]],
  ["কখনো হাল ছেড়ো না, সফলতা আসবেই 💪", ["motivation", "bangla"]],
  ["ঘুরতে যাওয়ার সেরা জায়গা 😍", ["travel", "reels", "viral"]],
  ["এই মুহূর্তটা ভুলবো না কখনো ❤️", ["moments", "fyp"]],
  ["শান্তির খোঁজে একটু বেরিয়ে পড়া 🚶", ["travel", "nature"]],
  ["ভিডিওটা শেষ পর্যন্ত দেখো 🔥", ["viral", "trending", "fyp"]],
  ["Weekend vibes only 🎶", ["vibes", "reels"]],
];

const VIDEO_IDS = [
  34487, 4883, 1171, 39767, 42294, 4813, 1164, 3248, 2244, 34404, 44347, 41576,
  47583, 50846, 4007, 39894, 42925, 43028, 1610, 2098, 4697, 18294, 23345,
];

const HOUR = 3600_000;
const BASE = Date.UTC(2026, 9, 25);

const STOCK_REELS: Post[] = VIDEO_IDS.map((vid, i) => {
  const c = CREATORS[i % CREATORS.length]!;
  const [text, tags] = CAPTIONS[(i * 3) % CAPTIONS.length]!;
  const views = 1200 + ((vid * 37) % 98000);
  return {
    id: `${PRELOADED_PREFIX}${vid}`,
    authorId: `${PRELOADED_PREFIX}${c.id}`,
    authorName: c.name,
    authorUsername: c.user,
    authorPhoto: `https://i.pravatar.cc/150?img=${c.img}`,
    text: `${text} ${tags.map((t) => `#${t}`).join(" ")}`,
    mediaUrl: `https://assets.mixkit.co/videos/${vid}/${vid}-720.mp4`,
    mediaType: "video/mp4",
    likes: [],
    comments: [],
    tags,
    views,
    shares: Math.floor(views / 90),
    createdAt: BASE - i * 5 * HOUR,
  };
});

/** Real-life videos with sound (Wikimedia Commons, freely licensed), hosted on our CDN. */
const REAL_VIDEOS: [string, string, string[]][] = [
  ["/__l5e/assets-v1/f13a8fc7-6b5a-4c90-bd6b-abfe7a6e5349/real-reel-4.mp4", "বন্ধুরা মিলে মজার নাচ 😂💃", ["funny", "reels"]],
  ["/__l5e/assets-v1/fb443d26-0701-4f9e-a5c4-071391a0b806/real-reel-3.mp4", "রাস্তার পাশে ডিমের পিঠা বানানো, দেখলেই জিভে জল 🤤", ["food", "reels"]],
  ["/__l5e/assets-v1/9f76464d-ab36-473a-9bd1-876dcf7a7109/real-reel-5.mp4", "বিড়ালটার দুষ্টুমি দেখে হাসি থামাতে পারবে না 😹", ["pets", "reels"]],
  ["/__l5e/assets-v1/c2b7cbdd-c3e0-49ed-8d7a-97ba2ad784e6/real-reel-11.mp4", "রাস্তায় হঠাৎ সবাই মিলে নাচ শুরু 🎉", ["dance", "reels"]],
  ["/__l5e/assets-v1/c8c98e11-c90f-4f24-97ae-199fb5dc3fac/real-reel-27.mp4", "বগুড়ায় দেশি পদ্ধতিতে মাছ ধরা 🇧🇩🎣", ["village", "reels"]],
  ["/__l5e/assets-v1/ab3e75fa-4e60-4788-8e71-56a4eaa3c9ac/real-reel-1.mp4", "সমুদ্রের পাড়ে আমাদের কুকুরটার আনন্দ দেখো 🐶🌊", ["pets", "reels"]],
  ["/__l5e/assets-v1/bf54e14d-1420-4813-ab51-4ec41b89220d/real-reel-24.mp4", "ব্যাংককের রাস্তায় স্কুইড ভাজা, ঝাল ঝাল 🌶️", ["food", "reels"]],
  ["/__l5e/assets-v1/fc73bf2c-61c7-4fb5-81b5-e3c686193e97/real-reel-18.mp4", "গলিতে বন্ধুদের সাথে ছোটবেলার খেলা, মনে পড়ে? 🥹", ["kids", "reels"]],
  ["/__l5e/assets-v1/5d5fb720-f35b-4547-a7ed-ec3aba7a6cb2/real-reel-2.mp4", "ঐতিহ্যবাহী নাচ, ঢোলের তালে মন নেচে উঠবে 🥁", ["dance", "reels"]],
  ["/__l5e/assets-v1/95e3a66c-3874-4335-b8ce-9a24dfa3d437/real-reel-28.mp4", "নৌকায় ভাসমান ফলের বাজার, কখনো দেখেছো? 🛶🍉", ["travel", "reels"]],
  ["/__l5e/assets-v1/e0c64ded-b25c-40ab-9fc1-659563e0a61b/real-reel-19.mp4", "দুই বিড়ালের খেলা, কে জিতবে? 🐱", ["pets", "reels"]],
  ["/__l5e/assets-v1/3359dd84-71ac-4a26-9a8d-c89a208ddf57/real-reel-9.mp4", "পাহাড়ি স্টাইলে মাংস রান্না, একদম আলাদা 🔥", ["food", "reels"]],
  ["/__l5e/assets-v1/98e2c0eb-183d-41f9-ae85-5a1f94d71e8d/real-reel-16.mp4", "খেলার মাঠে বাচ্চাদের হইচই 😄", ["kids", "reels"]],
  ["/__l5e/assets-v1/5ef34b2a-0928-4433-b9f3-394ecf9f8b6a/real-reel-20.mp4", "পাহাড়ের মঠে রঙিন মুখোশ উৎসব 🎭", ["festival", "reels"]],
  ["/__l5e/assets-v1/5d9cb082-4357-4185-b1c9-620efd2dad2b/real-reel-32.mp4", "মায়ের হাতের রান্না, সবচেয়ে প্রিয় 🍲", ["food", "reels"]],
  ["/__l5e/assets-v1/f1fb840e-525a-4aed-a6f8-99501136eefa/real-reel-14.mp4", "নদীতে মাছ ধরার মজাই আলাদা 🎣", ["village", "reels"]],
  ["/__l5e/assets-v1/80ca8783-7708-4798-8966-88cab258c2fc/real-reel-21.mp4", "একাই পুরো মঞ্চ মাতিয়ে দিলো 🔥", ["dance", "reels"]],
  ["/__l5e/assets-v1/d387820f-19bc-41b3-b837-8230a8fc51c5/real-reel-25.mp4", "হাতে বানানো ডাম্পলিং, শেষ পর্যন্ত দেখো 🥟", ["food", "reels"]],
  ["/__l5e/assets-v1/688a9d74-15cc-40b5-aa89-b3f65789ea1a/real-reel-12.mp4", "উৎসবের দিনে গ্রামের সবাই একসাথে 🎊", ["festival", "reels"]],
  ["/__l5e/assets-v1/0b6d0152-b67c-408a-bcc5-0310e72baaa8/real-reel-17.mp4", "স্কুলের বাচ্চারা শিক্ষকের সাথে খেলছে ❤️", ["kids", "reels"]],
  ["/__l5e/assets-v1/86aff018-e594-4745-92ce-9e85f97b9506/real-reel-10.mp4", "আজ বাসায় স্যালমন মাছ ভাজলাম 🐟", ["food", "reels"]],
  ["/__l5e/assets-v1/891408d6-9074-4180-ab02-8606a57e8823/real-reel-29.mp4", "লোকনৃত্যে মেতে উঠলো সবাই 🎶", ["dance", "reels"]],
  ["/__l5e/assets-v1/82659a17-9b8b-4866-9b02-a8405f63b536/real-reel-13.mp4", "গ্রামের সহজ সরল জীবন, এটাই আসল শান্তি 🏡", ["village", "reels"]],
  ["/__l5e/assets-v1/97fb433d-f99c-4e53-a8c2-950abfc73472/real-reel-26.mp4", "পাহাড়ি গ্রামের সাংস্কৃতিক নাচ 💃", ["dance", "reels"]],
  ["/__l5e/assets-v1/3b1ec2f8-e65e-484d-8bb9-bc0c3ccc106e/real-reel-15.mp4", "রেট্রো উৎসবে পুরনো দিনের গাড়ি আর গান 🚗🎶", ["festival", "reels"]],
  ["/__l5e/assets-v1/c2cb0300-ab41-4a10-a17c-ebbc81c21763/real-reel-31.mp4", "পাহাড়ি গ্রামের একটা সকাল ⛰️", ["travel", "reels"]],
  ["/__l5e/assets-v1/3767c322-2e1c-45fb-b381-31f082471096/real-reel-33.mp4", "সহজ রেসিপি: আদা-পেঁয়াজ দিয়ে ডিম ভাত 🍳", ["food", "reels"]],
];

const REAL_REELS: Post[] = REAL_VIDEOS.map(([url, text, tags], i) => {
  const c = CREATORS[(i * 5 + 3) % CREATORS.length]!;
  const views = 8000 + ((i * 7919) % 240000);
  const id = url.split("/").pop()!.replace(".mp4", "");
  return {
    id: `${PRELOADED_PREFIX}${id}`,
    authorId: `${PRELOADED_PREFIX}${c.id}`,
    authorName: c.name,
    authorUsername: c.user,
    authorPhoto: `https://i.pravatar.cc/150?img=${c.img}`,
    text,
    mediaUrl: url,
    mediaType: "video/mp4",
    likes: [],
    comments: [],
    tags,
    views,
    shares: Math.floor(views / 70),
    createdAt: BASE - i * 3 * HOUR,
  };
});

// Real videos (with sound) first, then the earlier preloaded reels — nothing removed.
export const PRELOADED_REELS: Post[] = [...REAL_REELS, ...STOCK_REELS];
