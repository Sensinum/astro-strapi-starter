import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const term = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
});

const block = z.object({
  kind: z.enum(['acf', 'html']),
  name: z.string().optional(),
  anchor: z.string().optional(),
  className: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  html: z.string().optional(),
});

const entry = z.object({
  wpId: z.number(),
  title: z.string(),
  slug: z.string(),
  path: z.string(),
  date: z.string(),
  modified: z.string(),
  template: z.string().nullable().optional(),
  excerpt: z.string().optional().default(''),
  featuredImage: z.string().nullable().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
  terms: z.record(z.string(), z.array(term)).optional(),
  acf: z.record(z.string(), z.any()).optional(),
  blocks: z.array(block).default([]),
  formReplaced: z.boolean().optional(),
});

function collection(dir: string) {
  return defineCollection({
    loader: glob({ pattern: '**/*.json', base: `./src/content/${dir}` }),
    schema: entry,
  });
}

export const collections = {
  pages: collection('pages'),
  posts: collection('posts'),
  events: collection('events'),
  eventSeries: collection('event-series'),
  speakers: collection('speakers'),
  talks: collection('talks'),
  podcasts: collection('podcasts'),
};
