import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/perfumes')({ component: Page });

function Page() {
  return <div><h1 className="font-serif text-4xl capitalize">perfumes</h1><p className="text-muted-foreground">This section is not finished yet.</p></div>;
}
