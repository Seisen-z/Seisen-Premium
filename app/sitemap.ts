import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://seisen.store';
  const now = new Date();

  return [
    { url: base,              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/reiya`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/premium`, lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/scripts`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/getkey`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/videos`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${base}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/refund`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
