-- Run in the SQL Editor of your own Supabase project.
-- Visitors can read feedback. A server-side function validates the shared code
-- before inserting a message. No GitHub token is used or exposed.
create table if not exists public.journal_feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (char_length(name) <= 80),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.journal_feedback enable row level security;
revoke all on public.journal_feedback from public, anon, authenticated;
grant usage on schema public to anon;
grant select (id, name, message, created_at) on public.journal_feedback to anon;
drop policy if exists "Visitors read feedback" on public.journal_feedback;
create policy "Visitors read feedback" on public.journal_feedback for select to anon using (true);
drop policy if exists "Visitors submit feedback" on public.journal_feedback;

create or replace function public.submit_journal_feedback(visitor_code text, author text, feedback text)
returns setof public.journal_feedback
language plpgsql security definer set search_path = ''
as $$
begin
  if visitor_code is distinct from 'AlexEELs' then
    raise insufficient_privilege using message = 'Incorrect access code';
  end if;
  if feedback is null or char_length(btrim(feedback)) not between 1 and 2000
     or char_length(coalesce(author, '')) > 80 then
    raise check_violation using message = 'Invalid feedback';
  end if;
  return query insert into public.journal_feedback (name, message)
    values (btrim(coalesce(author, '')), btrim(feedback)) returning *;
end;
$$;
revoke all on function public.submit_journal_feedback(text, text, text) from public, anon, authenticated;
grant execute on function public.submit_journal_feedback(text, text, text) to anon;
