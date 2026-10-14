<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the storefront in `src/components/storefront.tsx` and editable commerce settings and calculations in `src/lib/catalog.ts` so the preview and standalone export share behavior.
- Checkout uses client-side WhatsApp links and localStorage only, because this store does not require a messaging API or hosted checkout.
- Produce the standalone HTML from the shared storefront with embedded assets, compiled styles and browser JavaScript so its shopping behavior matches the preview.
