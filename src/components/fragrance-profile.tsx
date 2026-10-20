import { Flower2, Leaf, MoonStar, Snowflake, Sun } from 'lucide-react';
import { WEAR_OPTIONS, validPercentage, type Product } from '@/lib/catalog';

const wearIcons = { Winter: Snowflake, Spring: Flower2, Summer: Sun, Fall: Leaf, Day: Sun, Night: MoonStar };
export function FragranceProfile({ product }: { product: Product }) {
  const accords = (product.mainAccords ?? []).filter(item => validPercentage(item.percentage));
  const wear = WEAR_OPTIONS.filter(option => validPercentage(product.whenToWear?.[option]));
  if (!accords.length && !wear.length) return null;
  return <div className="fragrance-profile">
    {accords.length > 0 && <section aria-label="Main Accords"><h3>Main Accords</h3><div className="accord-list">{accords.map((accord, index) => <div key={index} className={`accord-item accord-${accord.color}`}><div className="profile-label"><span>{accord.name}</span></div><div className="profile-track" role="meter" aria-label={`${accord.name} accord strength`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={accord.percentage ?? 0}><span style={{ width: `${accord.percentage}%` }} /></div></div>)}</div></section>}
    {wear.length > 0 && <section aria-label="When to Wear"><h3>When to Wear</h3><div className="wear-grid">{wear.map(option => { const Icon = wearIcons[option]; const value = product.whenToWear?.[option] ?? 0; return <div className="wear-item" key={option}><Icon size={23} strokeWidth={1.5}/><span>{option}</span><span className="wear-value">{value}%</span><div className="profile-track" role="meter" aria-label={option} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }}/></div></div>; })}</div></section>}
  </div>;
}
