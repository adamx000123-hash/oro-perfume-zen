import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FragranceProfile } from "@/components/fragrance-profile";
import { ProductNewBadge } from "@/components/product-new-badge";
import {
  DEFAULT_PRODUCT_DISPLAY,
  money,
  productImages,
  resolveImage,
  productPriceBreakdown,
  ORDER_HASH_PREFIX,
  type Product,
} from "@/lib/catalog";
import { storeQuery } from "@/routes/index";

export const Route = createFileRoute("/perfume/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — ORO PARFUME` }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQuery),
  component: PerfumeDetails,
});


function ProductGallery({ product }: { product: Product }) {
  const images = productImages(product);
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);
  const move = (direction: number) => setActive(index => (index + direction + images.length) % images.length);
  return <div className="product-gallery">
    <div className="detail-page-image" onPointerDown={event => { startX.current = event.clientX; }} onPointerUp={event => { if (startX.current === null || images.length < 2) return; const delta = event.clientX - startX.current; if (Math.abs(delta) > 35) move(delta < 0 ? 1 : -1); startX.current = null; }} onPointerCancel={() => { startX.current = null; }}>
      <img src={resolveImage(images[active])} alt={`${product.name} perfume ${active + 1}`} width="800" height="800" draggable="false" />
      <ProductNewBadge createdAt={product.created_at} />
      {images.length > 1 && <><button type="button" className="gallery-arrow gallery-prev" onClick={() => move(-1)} aria-label="Previous perfume image"><ChevronLeft size={19} /></button><button type="button" className="gallery-arrow gallery-next" onClick={() => move(1)} aria-label="Next perfume image"><ChevronRight size={19} /></button></>}
    </div>
    {images.length > 1 && <div className="gallery-thumbnails" aria-label="Perfume images">{images.map((image, index) => <button type="button" className={index === active ? 'gallery-thumbnail is-active' : 'gallery-thumbnail'} key={`${image}-${index}`} onClick={() => setActive(index)} aria-label={`Show perfume image ${index + 1}`} aria-pressed={index === active}><img src={resolveImage(image)} alt="" width="80" height="80" /></button>)}</div>}
  </div>;
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
        <ProductGallery product={product} />
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
            <div className="detail-price-row">
              <span className="detail-size-label">{size} ml</span>
              {product.discount > 0 && <s className="original-price">{money(productPriceBreakdown(product, size).original)}</s>}
              <strong className="detail-current-price">{money(productPriceBreakdown(product, size).current)}</strong>
            </div>
            <Link to="/" hash={`${ORDER_HASH_PREFIX.slice(1)}${encodeURIComponent(product.id)}`} className="primary-cta detail-order-button">
              <ShoppingBag size={17} /> ORDER NOW
            </Link>
            <Link to="/" hash="perfumes" className="detail-continue">
              <ShoppingBag size={16} /> Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
