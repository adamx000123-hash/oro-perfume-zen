"""Create the single-file storefront from captured preview markup and compiled CSS.
Run after capturing /tmp/oro-markup.html and /tmp/oro-compiled.css from the preview.
"""
import base64, json, re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
markup = Path('/tmp/oro-markup.html').read_text()
css = Path('/tmp/oro-compiled.css').read_text()
catalog = json.loads(Path('/tmp/oro-catalog.json').read_text())
def data_url(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((root/'src/assets'/name).read_bytes()).decode()
for p in catalog:
    if p['type'] == 'product': p['image'] = data_url(Path(p['image']).name)
markup = re.sub(r'src="[^\"]*/(oro-hero|noir|rose|ambre|vert)\.jpg(?:\?[^\"]*)?"', lambda m: 'src="'+data_url(m[1]+'.jpg')+'"', markup)
settings = '// EDIT YOUR STORE HERE: prices in MAD, image data URLs, fragrance notes and offers.\nconst WHATSAPP_NUMBER = ""; // Replace with your real number, e.g. country code 212 followed by your number.\nconst OFFER_END = "2026-11-01T00:00:00Z";\nconst STORE_DATA = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n'
extra = '''[hidden]{display:none!important}.standalone-dialog{border:0;padding:0;background:var(--background);color:var(--foreground);width:calc(100% - 24px);max-width:850px;max-height:92dvh;overflow-y:auto;box-shadow:var(--shadow-elegant)}.standalone-dialog::backdrop{background:var(--overlay);backdrop-filter:blur(3px)}.standalone-dialog button{cursor:pointer;min-height:44px;border-radius:0;background:transparent;color:inherit;border:1px solid var(--border);padding:8px 14px;font-family:var(--font-sans)}.standalone-dialog .primary-cta{background:var(--primary);color:var(--primary-foreground)}.standalone-dialog.standalone-drawer{position:fixed;inset:0 0 0 auto;margin:0;width:470px;height:100dvh;max-height:100dvh;max-width:100%;padding-bottom:env(safe-area-inset-bottom)}@media(max-width:767px){.standalone-dialog.standalone-drawer{width:100%}}'''
html = '<!DOCTYPE html>\n<html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>ORO PARFUME — A Scent. A Signature.</title><meta name="description" content="Discover your signature scent with ORO PARFUME. Luxury fragrances, delivered in Nador only."><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Manrope:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600&family=Noto+Serif+Arabic:wght@400;500;600&display=swap"><style>'+css+'\n'+extra+'</style></head><body>'+markup+'\n<script>\n'+settings+(root/'scripts/standalone.js').read_text()+'\n</script></body></html>'
out = root/'public/oro-parfume.html'
out.write_text(html)
print(f'Created {out.name}: {out.stat().st_size:,} bytes')