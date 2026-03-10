-- Create pinned_events table for tourists to save favorite events
create table public.pinned_events (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  event_id uuid not null,
  pinned_at timestamp with time zone null default now(),
  constraint pinned_events_pkey primary key (id),
  constraint pinned_events_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint pinned_events_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade,
  constraint pinned_events_unique_user_event unique(user_id, event_id)
) tablespace pg_default;

-- Create index for faster lookups
create index pinned_events_user_id_idx on public.pinned_events (user_id);
create index pinned_events_event_id_idx on public.pinned_events (event_id);

-- Enable Row Level Security (RLS)
alter table public.pinned_events enable row level security;

-- Users can only see their own pinned events
create policy "Users can view their own pinned events"
  on public.pinned_events for select
  using (auth.uid() = user_id);

-- Users can create their own pinned events
create policy "Users can create their own pinned events"
  on public.pinned_events for insert
  with check (auth.uid() = user_id);

-- Users can delete their own pinned events
create policy "Users can delete their own pinned events"
  on public.pinned_events for delete
  using (auth.uid() = user_id);
