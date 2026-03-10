-- Create events table for municipality-created events
create table public.events (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  location text null,
  category text not null default 'other' check (category in ('festival', 'cultural', 'holiday', 'other')),
  municipality_id uuid not null,
  created_by uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id),
  constraint events_municipality_id_fkey foreign key (municipality_id) references auth.users (id) on delete cascade,
  constraint events_created_by_fkey foreign key (created_by) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Create trigger to update updated_at timestamp
create trigger set_events_updated_at before
update on events for each row
execute function set_updated_at ();

-- Enable Row Level Security (RLS)
alter table public.events enable row level security;

-- Anyone can read events
create policy "Events are viewable by anyone"
  on public.events for select
  using (true);

-- Only authenticated users can insert events
create policy "Users can create events for their municipality"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and municipality_id = auth.uid()
  );

-- Only the user who created the event or admins can update/delete
create policy "Users can update their own events"
  on public.events for update
  using (
    auth.uid() = created_by
    or (
      select role from profiles where id = auth.uid()
    ) = 'admin'
  )
  with check (
    auth.uid() = created_by
    or (
      select role from profiles where id = auth.uid()
    ) = 'admin'
  );

create policy "Users can delete their own events"
  on public.events for delete
  using (
    auth.uid() = created_by
    or (
      select role from profiles where id = auth.uid()
    ) = 'admin'
  );

-- Create indexes for faster queries
create index events_municipality_id_idx on public.events (municipality_id);
create index events_created_by_idx on public.events (created_by);
create index events_start_date_idx on public.events (start_date);
create index events_category_idx on public.events (category);
