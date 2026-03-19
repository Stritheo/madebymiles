/** Site-wide constants. Import from '@/site.config' in any .astro file. */

export const SITE = {
  name: 'Miles Sowden',
  url: 'https://milessowden.au',
  linkedIn: 'https://www.linkedin.com/in/milessowden',
  whatsApp: {
    number: '61414185721',
    link: (message: string) =>
      `https://wa.me/61414185721?text=${encodeURIComponent(message)}`,
  },
} as const;
