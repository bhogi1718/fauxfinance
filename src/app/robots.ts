import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/faq", "/login", "/signup"],
      disallow: ["/api/", "/dashboard", "/portfolio", "/watchlist", "/history", "/settings"],
    },
  };
}
