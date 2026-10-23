-- Optional owner-run configuration. Nothing in this file is run by the webpage.
-- Only add the table to Realtime if it is not already in the publication.
-- Five-second polling works without this publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'cheeko-game'
  ) then
    alter publication supabase_realtime add table public."cheeko-game";
  end if;
end $$;

-- Optional public read policy. Review existing policies before applying.
-- These grants allow this page to read results; it does not need write access.
alter table public."cheeko-game" enable row level security;
grant usage on schema public to anon;
grant select on table public."cheeko-game" to anon;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cheeko-game'
      and policyname = 'cheeko_public_image_read'
  ) then
    create policy cheeko_public_image_read on public."cheeko-game"
      for select to anon using (img_url is not null);
  end if;
end $$;
