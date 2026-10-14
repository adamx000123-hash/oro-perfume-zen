import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'ORO PARFUME — A Scent. A Signature.' },
    { name: 'description', content: 'Discover ORO PARFUME’s signature fragrances. Shop perfume for men, women and everyone, with delivery across Morocco and cash on delivery.' },
    { property: 'og:title', content: 'ORO PARFUME — The Signature Collection' },
    { property: 'og:description', content: 'Extraordinary fragrances. Unforgettable moments. Explore your next signature scent.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Storefront,
});
