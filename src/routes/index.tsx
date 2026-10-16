import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Storefront } from '@/components/storefront';
import { getStoreData } from '@/lib/store.functions';

export const storeQuery = queryOptions({ queryKey: ['store'], queryFn: () => getStoreData() });

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'ORO PARFUME — A Scent. A Signature.' },
    { name: 'description', content: 'Discover ORO PARFUME’s signature fragrances. Shop perfume for men, women and everyone, with delivery across Morocco and cash on delivery.' },
    { property: 'og:title', content: 'ORO PARFUME — The Signature Collection' },
    { property: 'og:description', content: 'Extraordinary fragrances. Unforgettable moments. Explore your next signature scent.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(storeQuery);
  return <Storefront data={data} />;
}
