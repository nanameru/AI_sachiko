-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgvector";

-- Create search_queries table
create table public.search_queries (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users not null,
    query_text text not null,
    vector_query vector(768),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create search_results table
create table public.search_results (
    id bigint generated always as identity primary key,
    query_id bigint references public.search_queries not null,
    result_data jsonb not null,
    relevance_score float,
    created_at timestamptz default now()
);

-- Create search_cache table
create table public.search_cache (
    id bigint generated always as identity primary key,
    query_hash text not null unique,
    query_text text not null,
    results jsonb not null,
    created_at timestamptz default now(),
    expires_at timestamptz not null
);

-- Create vector_documents table for semantic search
create table public.vector_documents (
    id bigint generated always as identity primary key,
    content text not null,
    embedding vector(768) not null,
    metadata jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.search_queries enable row level security;
alter table public.search_results enable row level security;
alter table public.search_cache enable row level security;
alter table public.vector_documents enable row level security;

-- Create indexes
create index search_queries_user_id_idx on public.search_queries(user_id);
create index search_queries_created_at_idx on public.search_queries(created_at);
create index search_cache_query_hash_idx on public.search_cache(query_hash);
create index search_cache_expires_at_idx on public.search_cache(expires_at);
create index vector_documents_embedding_idx on public.vector_documents using ivfflat (embedding vector_cosine_ops);

-- Create RLS policies
-- Search queries policies
create policy "Users can view their own search queries"
on public.search_queries for select
using (auth.uid() = user_id);

create policy "Users can insert their own search queries"
on public.search_queries for insert
with check (auth.uid() = user_id);

-- Search results policies
create policy "Users can view results of their queries"
on public.search_results for select
using (
    exists (
        select 1 from public.search_queries
        where search_queries.id = search_results.query_id
        and search_queries.user_id = auth.uid()
    )
);

create policy "System can insert search results"
on public.search_results for insert
with check (true);

-- Search cache policies
create policy "Anyone can view cached results"
on public.search_cache for select
using (true);

create policy "System can manage cache"
on public.search_cache for all
using (true);

-- Vector documents policies
create policy "Anyone can view vector documents"
on public.vector_documents for select
using (true);

create policy "Only system can manage vector documents"
on public.vector_documents for all
using (true);

-- Functions
create or replace function public.search_with_vector(
    query_text text,
    vector_query vector(768),
    max_results int default 10
) returns table (
    document_id bigint,
    content text,
    similarity float
) language plpgsql security definer as $$
begin
    return query
    select
        vd.id as document_id,
        vd.content,
        1 - (vd.embedding <=> vector_query) as similarity
    from
        public.vector_documents vd
    where
        1 - (vd.embedding <=> vector_query) > 0.7
    order by
        vd.embedding <=> vector_query
    limit max_results;
end;
$$;

-- Triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.search_queries
    for each row
    execute function public.handle_updated_at();

create trigger set_updated_at
    before update on public.vector_documents
    for each row
    execute function public.handle_updated_at();

-- Comments
comment on table public.search_queries is 'Stores user search queries and their vector representations';
comment on table public.search_results is 'Stores search results for each query';
comment on table public.search_cache is 'Caches search results for performance optimization';
comment on table public.vector_documents is 'Stores documents with their vector embeddings for semantic search';