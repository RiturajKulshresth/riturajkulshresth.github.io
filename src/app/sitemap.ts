/**
 * Static sitemap for GitHub Pages (`output: "export"`). Lists the home page,
 * standalone routes (Photography, Terminal), and all alternate render modes.
 */
import type { MetadataRoute } from "next";

const BASE_URL = "https://riturajkulshresth.github.io";

// Required by Next.js 16 when `output: "export"` is set - tells the build to
// statically generate /sitemap.xml at compile time instead of treating the
// route handler as potentially dynamic.
export const dynamic = "force-static";

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
    {
      url: `${BASE_URL}/terminal`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Render modes share lower priority than primary content routes.
    ...["windows95", "cli", "editorial", "magazine", "munchkincat", "badui"].map(
      (slug) => ({
        url: `${BASE_URL}/${slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })
    ),
  ];
}
