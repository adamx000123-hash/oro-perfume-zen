import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FragranceProfile } from "@/components/fragrance-profile";
import {
  DEFAULT_PRODUCT_DISPLAY,
  money,
  resolveImage,
  unitPrice,
  type CartItem,
} from "@/lib/catalog";
import { storeQuery } from "@/routes/index";

export const Route = createFileRoute("/perfume/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — ORO PARFUME` }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQuery),
  component: PerfumeDetails,
});

function addToSavedCart(id: string, size: number) {
  try {
    const saved: CartItem[] = JSON.parse(localStorage.getItem("oro-cart") ?? "[]");
    const existing = saved.find((item) => item.id === id && item.size === size);
    const next = existing
      ? saved.map((item) =>
          item === existing ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item,
        )
      : [...saved, { id, size, quantity: 1 }];
    localStorage.setItem("oro-cart", JSON.stringify(next));
  } catch {
    localStorage.setItem("oro-cart", JSON.stringify([{ id, size, quantity: 1 }]));
  }
}

function PerfumeDetails() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(storeQuery);
  const product = data.products.find((item) => item.id === decodeURIComponent(id));
  if (!product)
    return (
      <main className="detail-page section-wrap">
        <Link to="/" className="text-link">
          <ArrowLeft size={16} /> Back to collection
        </Link>
        <h1>Fragrance not found</h1>
      </main>
    );
  const display = product.display ?? DEFAULT_PRODUCT_DISPLAY;
  const size = display.sizes[0] ?? 100;
  const notes = (product.notes ?? []).filter((note) => note.trim());
  return (
    <main className="detail-page section-wrap">
      <Link to="/" className="text-link detail-back">
        <ArrowLeft size={16} /> Back to collection
      </Link>
      <div className="detail-page-grid">
        <div className="detail-page-image">
          <img
            src={resolveImage(product.image)}
            alt={`${product.name} perfume bottle`}
            width="800"
            height="800"
          />
        </div>
        <div className="detail-page-copy">
          <span className="eyebrow">{product.category} · EAU DE PARFUM</span>
          <h1>{product.name}</h1>
          {product.family.trim() && <p className="detail-family">{product.family}</p>}
          {product.description.trim() && (
            <section>
              <h2>Description</h2>
              <p className="detail-description">{product.description}</p>
            </section>
          )}
          {notes.length > 0 && (
            <section className="detail-notes">
              <h2>Notes</h2>
              {notes.map((note, index) => (
                <div key={`${note}-${index}`}>
                  <span>{["Top notes", "Heart notes", "Base notes"][index] ?? "Notes"}</span>
                  <p>{note}</p>
                </div>
              ))}
            </section>
          )}
          <FragranceProfile product={product} />
          <div className="detail-page-buy">
            <strong>
              {money(Math.round(unitPrice(product, size) * (1 - product.discount / 100)))}
            </strong>
            <Button className="primary-cta" onClick={() => addToSavedCart(product.id, size)}>
              <Plus size={17} /> Add to bag
            </Button>
            <Link to="/" hash="perfumes" className="detail-continue">
              <ShoppingBag size={16} /> Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
