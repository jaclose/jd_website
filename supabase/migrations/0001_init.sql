-- JD-1184 system — initial schema.
-- The site runs fully from local content files until these tables are
-- populated; lib/db.ts falls back automatically when env vars are absent.

create table if not exists quotes (
  id bigint generated always as identity primary key,
  text text not null,
  source text not null,
  week date not null unique,
  created_at timestamptz not null default now()
);

create table if not exists garden_skills (
  id text primary key,
  name text not null,
  domain text not null check (domain in ('mind', 'craft', 'body', 'spirit')),
  planted date not null,
  stage smallint not null default 0 check (stage between 0 and 5),
  note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists changelog (
  id bigint generated always as identity primary key,
  date date not null,
  type text not null check (type in ('feat', 'fix', 'life', 'garden', 'essay', 'note')),
  message text not null,
  additions integer not null default 0,
  deletions integer not null default 0
);

-- visitor achievements: guestbook signatures, correspondence, first contact
create table if not exists guestbook (
  id bigint generated always as identity primary key,
  name text not null,
  message text not null check (char_length(message) <= 600),
  created_at timestamptz not null default now(),
  approved boolean not null default false
);

alter table quotes enable row level security;
alter table garden_skills enable row level security;
alter table changelog enable row level security;
alter table guestbook enable row level security;

-- public read, owner-only write (writes go through the service role)
create policy "public read quotes" on quotes for select using (true);
create policy "public read garden" on garden_skills for select using (true);
create policy "public read changelog" on changelog for select using (true);
create policy "public read approved guestbook" on guestbook for select using (approved);
create policy "public sign guestbook" on guestbook for insert with check (true);
