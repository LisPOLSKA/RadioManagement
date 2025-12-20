export const categories = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Electronic",
  "Jazz",
  "Classical",
  "Reggae",
  "Meme",
  "Other",
] as const;

export type Category = (typeof categories)[number];