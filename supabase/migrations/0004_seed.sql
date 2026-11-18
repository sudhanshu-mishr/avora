-- SAMPLE DATA ONLY. Clearly not real platform statistics or real users.
-- Apply with: supabase db reset  (loads migrations + this file).
insert into public.skills (name, description) values
  ('Machine Learning','Models and ML pipelines'),
  ('Embedded Systems','Firmware and microcontrollers'),
  ('Computer Vision','Image and video understanding'),
  ('Product Design','UX and interface design'),
  ('Full-stack Development','End-to-end web apps')
on conflict (name) do nothing;
-- (Optional) To create sample users, sign up through the app. Do not fabricate
-- authenticated identities in seed data; AVORA never presents fake activity.