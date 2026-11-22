import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/client/'],
      },
    ],
    sitemap: 'https://seisen.store/sitemap.xml',
  };
}
