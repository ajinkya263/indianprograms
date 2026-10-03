-- ============================================
-- IndianPrograms Database Schema for Supabase
-- Paste this into Supabase SQL Editor and run
-- ============================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ==================
-- PROFILES TABLE
-- ==================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  email text not null default '',
  role text not null default 'visitor' check (role in ('visitor', 'publisher', 'admin')),
  slug text unique,
  bio text default '',
  suspended boolean not null default false,
  joined_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ==================
-- EVENTS TABLE
-- ==================
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null check (category in (
    'festival', 'dance', 'vocal', 'instrumental', 'movies',
    'competition', 'standup', 'workshop', 'play', 'poetry'
  )),
  description text not null default '',
  venue text not null default '',
  city text not null default '',
  state text not null default '',
  date date not null,
  time text not null default '',
  ticket_url text default '',
  price text not null default 'Free' check (price in ('Free', 'Paid')),
  image_url text default '',
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  publisher_id uuid references public.profiles(id) on delete cascade not null,
  publisher_name text not null default '',
  submitted_at timestamp with time zone default now()
);

alter table public.events enable row level security;

-- Anyone can view published events
create policy "Published events are viewable by everyone"
  on public.events for select using (
    status = 'published'
    or publisher_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Publishers can insert events
create policy "Publishers can insert events"
  on public.events for insert with check (
    auth.uid() = publisher_id
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('publisher', 'admin'))
  );

-- Publishers can update their own events, admins can update any
create policy "Publishers can update own events"
  on public.events for update using (
    publisher_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Publishers can delete their own events
create policy "Publishers can delete own events"
  on public.events for delete using (
    publisher_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ==================
-- FUNCTION: Handle new user signup
-- ==================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'visitor')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==================
-- STORAGE: Event Posters
-- ==================
insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true);

-- Anyone can view posters (public bucket)
create policy "Public poster access"
  on storage.objects for select
  using (bucket_id = 'event-posters');

-- Authenticated users can upload posters
create policy "Authenticated users can upload posters"
  on storage.objects for insert
  with check (
    bucket_id = 'event-posters'
    and auth.role() = 'authenticated'
  );

-- Users can update their own posters
create policy "Users can update own posters"
  on storage.objects for update
  using (
    bucket_id = 'event-posters'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own posters
create policy "Users can delete own posters"
  on storage.objects for delete
  using (
    bucket_id = 'event-posters'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==================
-- INDEXES
-- ==================
create index idx_events_status on public.events(status);
create index idx_events_city on public.events(city);
create index idx_events_category on public.events(category);
create index idx_events_date on public.events(date);
create index idx_events_publisher on public.events(publisher_id);
create index idx_profiles_slug on public.profiles(slug);
create index idx_profiles_role on public.profiles(role);
