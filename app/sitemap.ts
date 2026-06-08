import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://seisen.vercel.app';
  const now = new Date();

  return [
    { url: base,              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/premium`, lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/scripts`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/getkey`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/videos`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${base}/legal`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
