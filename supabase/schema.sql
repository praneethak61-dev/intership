create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  prospect_role text,
  prospect_company text,
  started_at timestamptz default now(),
  closed_at timestamptz,
  outcome text,
  current_stage int default 1
);

create table if not exists call_stages (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id) on delete cascade,
  stage_number int not null,
  what_happened text[],
  prospect_words text,
  created_at timestamptz default now(),
  unique(call_id, stage_number)
);
