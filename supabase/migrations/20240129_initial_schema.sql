-- Create items table
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_url text not null,
  description text,
  search_status text default 'pending', -- pending, searching, completed, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create price_findings table
create table price_findings (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete cascade not null,
  source text not null, -- 'ebay', 'facebook', 'craigslist', etc.
  price numeric(10, 2) not null,
  currency text default 'USD',
  url text,
  title text,
  image_url text,
  found_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table items enable row level security;
alter table price_findings enable row level security;

-- Policies for items
create policy "Users can view their own items"
  on items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on items for update
  using (auth.uid() = user_id);

-- Policies for price_findings (viewable by item owner)
create policy "Users can view findings for their items"
  on price_findings for select
  using (exists (
    select 1 from items
    where items.id = price_findings.item_id
    and items.user_id = auth.uid()
  ));

-- Storage bucket for item images
insert into storage.buckets (id, name, public) 
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

create policy "Item images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'item-images' );

create policy "Users can upload item images"
  on storage.objects for insert
  with check ( bucket_id = 'item-images' and auth.uid() = owner );
