-- Server-only, short-lived credentials. No public newsletter address lookup.
create table public.newsletter_requests (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  email text not null check (length(email) <= 254),
  preferences text[] not null default '{}' check (preferences <@ array['essay','field_note','project']::text[]),
  intent text not null check (intent in ('subscribe','manage')),
  ip_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  used_at timestamptz
);
create index newsletter_requests_email_time on public.newsletter_requests(email, created_at);
create index newsletter_requests_ip_time on public.newsletter_requests(ip_hash, created_at);
alter table public.newsletter_requests enable row level security;
revoke all on public.newsletter_requests from public, anon, authenticated;
grant select, insert, update, delete on public.newsletter_requests to service_role;

create function public.newsletter_issue(p_token_hash text, p_email text, p_preferences text[], p_intent text, p_ip_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  -- Fixed lock order serializes limits across serverless instances.
  perform pg_advisory_xact_lock(hashtextextended('newsletter-ip:' || p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('newsletter-email:' || p_email, 0));
  delete from public.newsletter_requests where created_at < now() - interval '7 days';
  if (select count(*) from public.newsletter_requests where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.newsletter_requests where email = p_email and created_at > now() - interval '1 hour') >= 3 then
    return false;
  end if;
  insert into public.newsletter_requests(token_hash,email,preferences,intent,ip_hash)
    values(p_token_hash,p_email,p_preferences,p_intent,p_ip_hash);
  return true;
end;
$$;

create function public.newsletter_consume(p_token_hash text)
returns setof public.newsletter_requests language plpgsql security invoker set search_path = '' as $$
declare r public.newsletter_requests;
begin
  select * into r from public.newsletter_requests where token_hash = p_token_hash;
  if not found then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('newsletter-email:' || r.email, 0));
  -- Recheck after the lock: exactly one competing credential can be used.
  update public.newsletter_requests set used_at = now()
    where token_hash = p_token_hash and used_at is null and expires_at > now()
    returning * into r;
  if not found then return; end if;
  update public.newsletter_requests set used_at = now() where email = r.email and used_at is null;
  return next r;
end;
$$;
revoke all on function public.newsletter_issue(text,text,text[],text,text) from public, anon, authenticated;
revoke all on function public.newsletter_consume(text) from public, anon, authenticated;
grant execute on function public.newsletter_issue(text,text,text[],text,text) to service_role;
grant execute on function public.newsletter_consume(text) to service_role;
