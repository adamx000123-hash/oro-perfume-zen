import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/offers')({ component: Page });

function Page() {
  return <div><h1 className="font-serif text-4xl capitalize">offers</h1><p className="text-muted-foreground">This section is not finished yet.</p></div>;
}
