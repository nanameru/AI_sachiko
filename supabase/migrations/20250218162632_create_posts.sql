-- Migration: Create posts table
-- Created at: 2025-02-18 16:26:32

-- disable RLS
alter table public. disable row level security;


-- Create table
create table public.posts (
  id bigint generated always as identity primary key,
  title text not null,
  content text,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.posts enable row level security;

comment on table public.posts is 'Posts table for managing posts data';


-- Create indexes
create index posts_user_id_idx 
on public.posts 
using btree (user_id);

create index posts_created_at_idx 
on public.posts 
using btree (created_at);


-- Create policies
create policy "Posts are viewable by everyone"
on public.posts
for select
using (true)
;

create policy "Users can create their own posts"
on public.posts
for insert
with check (auth.uid() = user_id)
;

create policy "Users can update their own posts"
on public.posts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id)
;

create policy "Users can delete their own posts"
on public.posts
for delete
using (auth.uid() = user_id)
;


-- enable RLS
alter table public. enable row level security;

-- verify migration
do $$
begin
  assert (select count(*) from pg_tables where tablename = '') = 1,
    'Table  was not created properly';
end $$;

