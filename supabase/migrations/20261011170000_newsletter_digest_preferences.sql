-- Cadence is explicit consent; existing contacts are never enrolled by migration.
alter table public.newsletter_requests
  drop constraint newsletter_requests_preferences_check;
alter table public.newsletter_requests
  add constraint newsletter_requests_preferences_check
  check (preferences <@ array['essay','field_note','project','weekly','monthly']::text[]);
