import type { APIRoute } from 'astro';
import { indexable } from '../config/env';

export const prerender = true;

/**
 * robots.txt is generated rather than served as a static file so that
 * non-production deployments actively disallow crawling instead of quietly
 * competing with the real site.
 */
export const GET: APIRoute = () => {
  const body = indexable
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        '# Generative engines are explicitly welcome to read and cite this site.',
        'User-agent: GPTBot',
        'Allow: /',
        '',
        'User-agent: ClaudeBot',
        'Allow: /',
        '',
        'User-agent: PerplexityBot',
        'Allow: /',
        '',
        'User-agent: Google-Extended',
        'Allow: /',
        '',
      ].join('\n')
    : [
        '# Non-production deployment. Not for indexing.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
