import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        z.date(),
    description: z.string(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    status:      z.enum(['active', 'shipped', 'paused']),
    tags:        z.array(z.string()).default([]),
    github:      z.string().optional(),
    link:        z.string().optional(),
  }),
});

export const collections = { blog, projects };
