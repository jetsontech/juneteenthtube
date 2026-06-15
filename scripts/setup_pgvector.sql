-- ==========================================
-- CULTUREQUEST 2026: AI VECTOR ENGINE
-- ==========================================
-- Instructions: Run this script in your Supabase SQL Editor.

-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Add an embedding column to your videos table (384 dimensions for all-MiniLM-L6-v2)
alter table videos add column if not exists embedding vector(384);

-- 3. Create a function to search for semantically related videos using Cosine Distance
create or replace function match_videos (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  exclude_id uuid
)
returns table (
  id uuid,
  title text,
  similarity float
)
language sql stable
as $$
  select
    videos.id,
    videos.title,
    1 - (videos.embedding <=> query_embedding) as similarity
  from videos
  where videos.embedding is not null
    and videos.id != exclude_id
    and videos.owner_id is not null
    and 1 - (videos.embedding <=> query_embedding) > match_threshold
  order by videos.embedding <=> query_embedding
  limit match_count;
$$;

-- 4. Create an HNSW index for lightning-fast nearest-neighbor search
create index on videos using hnsw (embedding vector_cosine_ops);
