import type { MetadataRoute } from "next";

const BASE_URL = "https://riturajkulshresth.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/photography`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
