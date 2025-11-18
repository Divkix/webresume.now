-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Resumes policies
create policy "Users can view own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

-- Site data policies
create policy "Public site data is viewable by everyone"
  on site_data for select
  using (true);

create policy "Users can update own site data"
  on site_data for update
  using (auth.uid() = user_id);

create policy "Users can insert own site data"
  on site_data for insert
  with check (auth.uid() = user_id);

-- Redirects policies
create policy "Redirects are viewable by everyone"
  on redirects for select
  using (true);
