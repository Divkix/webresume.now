create table redirects (
  id uuid default uuid_generate_v4() primary key,
  old_handle text not null,
  new_handle text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table redirects enable row level security;

create index redirects_old_handle_idx on redirects(old_handle);
create index redirects_expires_at_idx on redirects(expires_at);
