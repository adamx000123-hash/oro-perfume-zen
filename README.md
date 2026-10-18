# Oro Perfume Zen

Build a professional, luxury perfume e-commerce website for a brand called "ORO PARFUME", as a single HTML file (CSS and JS inside the same file). The entire interface must be in English (LTR), and fully responsive across ALL devices and screen sizes: small phones (320px), phones, tablets, laptops, desktops, and ultra-wide screens.

**Visual identity (from the logo):**
- Colors: cream background (#F6EEE6), warm black text (#1C1A17), gold accents (#B89A6A)
- Fonts: elegant serif for headings (e.g., Cormorant Garamond), light sans-serif for body (e.g., Jost), with wide letter-spacing on small uppercase labels
- Style: luxurious, minimal, generous white space, thin gold dividers, smooth animations (fade-in on scroll)

**Responsive requirements:**
- Mobile-first approach with breakpoints for 480px, 768px, 1024px, 1440px+
- Fluid typography using clamp(), flexible layouts with CSS Grid and Flexbox
- Product grid: 1 column on small phones, 2 on phones/tablets, 3 on laptops, 4 on large screens
- Hamburger menu on mobile/tablet, full navigation bar on desktop
- Cart as a side drawer on desktop and a full-screen panel on mobile
- Touch-friendly buttons (minimum 44px), no horizontal scrolling on any device
- Images scale properly (object-fit, aspect-ratio), respects safe areas on notched phones

**Sections:**
1. **Sticky header:** ORO PARFUME logo (text), navigation (Home, Perfumes, Offers, About, Contact), cart icon with item counter
2. **Hero:** striking headline, short tagline, "Discover the Collection" button
3. **Offers section:** prominent banner plus offer cards (percentage discounts, "Buy 2 Get 1" bundles, limited-time offer with countdown timer), "-30%" badges on discounted products
4. **Perfumes section:** product grid with 6-8 sample perfumes. Each card has: image, name, category (Men / Women / Unisex), size, price in MAD, "Add to Cart" button. Include category filter and search bar
5. **Product details modal:** fragrance notes (top / heart / base), size selector, quantity selector
6. **Cart drawer:** edit quantities, remove items, subtotal, discount, total, "Order via WhatsApp" button
7. **Checkout via WhatsApp:** simple form (Full Name, Phone, City, Address). On submit, generate a link `https://wa.me/212XXXXXXXXX?text=...` with a well-structured pre-filled message containing order details (products, quantities, prices, total, customer info). Payment: cash on delivery or as agreed on WhatsApp
8. **Why Choose Us:** 3-4 features (100% authentic fragrances, delivery in Nador only, cash on delivery, WhatsApp support)
9. **Footer:** links, contact (WhatsApp, Instagram), copyright

**Functionality (JavaScript):**
- Cart saved in localStorage
- Automatic total and discount calculation
- Floating WhatsApp button fixed in the corner
- All products and offers stored in one easy-to-edit JS array at the top of the code, and the WhatsApp number in a single variable

**Extra:** Use elegant placeholder images, write clean accessible HTML (semantic tags, alt text, aria-labels), and comment the code clearly so I can easily change prices, images, and the phone number.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://oro-perfume-zen.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/26cd5359-c863-484c-87c6-6703e4624e91).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Vercel deployment

This app reads the live catalog from the same Supabase project used by the Admin dashboard. In the Vercel project settings, add these Environment Variables for **Production, Preview, and Development**, then redeploy:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the values from the connected Supabase project; never commit `.env`. If these variables are missing in production, the app intentionally shows an empty catalog instead of the bundled demo perfumes, so deleted Admin products cannot reappear.
