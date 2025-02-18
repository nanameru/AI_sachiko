-- Create chats table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chats enable row level security;

create policy "Chats are viewable by owner"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Chats can be created by authenticated users"
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Chats can be updated by owner"
  on public.chats for update
  using (auth.uid() = user_id);

create policy "Chats can be deleted by owner"
  on public.chats for delete
  using (auth.uid() = user_id);

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  content text not null,
  role text not null check (role in ('user', 'assistant')),
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by chat owner"
  on public.messages for select
  using (
    auth.uid() = (
      select user_id from public.chats where id = chat_id
    )
  );

create policy "Messages can be created by chat owner"
  on public.messages for insert
  with check (
    auth.uid() = (
      select user_id from public.chats where id = chat_id
    )
  );

-- Create memory_bank table
create table public.memory_bank (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  tags text[] default '{}' not null,
  created_at timestamptz default now() not null
);

alter table public.memory_bank enable row level security;

create policy "Memory bank entries are viewable by owner"
  on public.memory_bank for select
  using (auth.uid() = user_id);

create policy "Memory bank entries can be created by authenticated users"
  on public.memory_bank for insert
  with check (auth.uid() = user_id);

create policy "Memory bank entries can be updated by owner"
  on public.memory_bank for update
  using (auth.uid() = user_id);

create policy "Memory bank entries can be deleted by owner"
  on public.memory_bank for delete
  using (auth.uid() = user_id);

-- Create user_settings table
create table public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  theme text not null check (theme in ('light', 'dark')) default 'light',
  language text not null check (language in ('ja', 'en')) default 'ja',
  notifications_enabled boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_settings enable row level security;

create policy "User settings are viewable by owner"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "User settings can be created by authenticated users"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "User settings can be updated by owner"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Create indexes
create index chats_user_id_idx on public.chats (user_id);
create index messages_chat_id_idx on public.messages (chat_id);
create index memory_bank_user_id_idx on public.memory_bank (user_id);
create index memory_bank_tags_idx on public.memory_bank using gin (tags);

-- Enable full text search for memory bank
alter table public.memory_bank add column content_search tsvector
  generated always as (to_tsvector('japanese', content)) stored;

create index memory_bank_content_search_idx on public.memory_bank using gin (content_search);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create default user settings
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 