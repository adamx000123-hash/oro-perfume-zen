create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.products (
  id text primary key,
  name text not null,
  category text not null default 'Unisex' check (category in ('Men','Women','Unisex')),
  family text not null default '',
  price integer not null default 0 check (price >= 0),
  discount integer not null default 0 check (discount between 0 and 90),
  image text not null default '',
  notes text[] not null default array['','',''],
  visible boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public reads visible products" on public.products for select to anon, authenticated using (visible or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update products" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  name text not null,
  description text not null default '',
  kind text not null default 'percentage' check (kind in ('percentage','bundle','limited')),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.offers to anon;
grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "Public reads active offers" on public.offers for select to anon, authenticated using (active or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert offers" on public.offers for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update offers" on public.offers for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete offers" on public.offers for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '',
  instagram_url text not null default '',
  offer_end timestamptz not null default '2026-11-01T00:00:00Z'
);
grant select on public.site_settings to anon;
grant select, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Public reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);
grant insert on public.visits to anon, authenticated;
grant select on public.visits to authenticated;
grant all on public.visits to service_role;
alter table public.visits enable row level security;
create policy "Anyone records a visit" on public.visits for insert to anon, authenticated with check (true);
create policy "Admins read visits" on public.visits for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Public reads product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins change product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

insert into public.site_settings (id) values (1);
insert into public.products (id, name, category, family, price, discount, image, notes, sort) values
('noir','Noir Absolu','Men','Woody · Intense',690,30,'noir',array['Bergamot, black pepper','Iris, cedarwood','Amber, leather, musk'],1),
('rose','Rose Éternelle','Women','Floral · Delicate',590,0,'rose',array['Lychee, pink pepper','Damask rose, peony','White musk, vanilla'],2),
('ambre','Ambre Royal','Unisex','Oriental · Warm',790,30,'ambre',array['Saffron, mandarin','Amber, jasmine','Oud, sandalwood, vanilla'],3),
('vert','Bois de Lumière','Unisex','Fresh · Woody',650,0,'vert',array['Bergamot, lemon','Vetiver, green tea','Cedarwood, white musk'],4),
('velours','Velours de Nuit','Women','Floral · Sensual',720,0,'rose',array['Blackcurrant, pear','Jasmine, orange blossom','Patchouli, vanilla'],5),
('oud','Oud Impérial','Men','Woody · Spiced',890,0,'noir',array['Cardamom, saffron','Oud, rose','Leather, sandalwood'],6),
('soleil','Soleil Doré','Unisex','Amber · Radiant',620,0,'ambre',array['Neroli, mandarin','Ylang-ylang, jasmine','Amber, vanilla'],7),
('jardin','Jardin Secret','Women','Fresh · Floral',560,0,'vert',array['Green apple, bergamot','Lily, magnolia','Musk, cedar'],8);
insert into public.offers (label, name, description, kind, sort) values
('THE SIGNATURE EDIT','Your signature, for less.','30% off selected fragrances','percentage',1),
('THE PERFECT TRIO','Good things come in threes.','Buy 2, get your third fragrance free','bundle',2),
('ONLY FOR A MOMENT','A little luxury. A limited moment.','The signature selection · Until 31 October','limited',3);