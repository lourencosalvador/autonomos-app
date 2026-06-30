-- =====================================================================
-- Autonomos — Seed de 2 prestadores de teste
--   • Pintor (homem)        → login: pintor.teste@autonomos.app
--   • Make Up (mulher)      → login: makeup.teste@autonomos.app
--   • Senha (ambos):          Teste@1234
-- Rodar no Supabase → SQL Editor → Run. Idempotente (pode correr 2x).
-- profiles.id é FK para auth.users, por isso criamos o utilizador auth primeiro.
-- =====================================================================

do $$
declare
  painter_id uuid;
  makeup_id  uuid;
begin
  -- ---------------------------------------------------------------
  -- 1) PINTOR (homem)
  -- ---------------------------------------------------------------
  select id into painter_id from auth.users where email = 'pintor.teste@autonomos.app';
  if painter_id is null then
    painter_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', painter_id, 'authenticated', 'authenticated',
      'pintor.teste@autonomos.app', crypt('Teste@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (painter_id::text, painter_id,
      jsonb_build_object('sub', painter_id::text, 'email', 'pintor.teste@autonomos.app'),
      'email', now(), now(), now());
  end if;

  insert into public.profiles (id, role, name, phone, gender, work_area, avatar_url, approval_status, onboarding_completed, updated_at)
  values (
    painter_id, 'professional', 'Edson Pintor', '923456789', 'Masculino', 'Pintura',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'approved', true, now()
  )
  on conflict (id) do update set
    role = 'professional', name = excluded.name, phone = excluded.phone, gender = excluded.gender,
    work_area = excluded.work_area, avatar_url = excluded.avatar_url,
    approval_status = 'approved', onboarding_completed = true, updated_at = now();

  -- ---------------------------------------------------------------
  -- 2) MAKE UP (mulher)
  -- ---------------------------------------------------------------
  select id into makeup_id from auth.users where email = 'makeup.teste@autonomos.app';
  if makeup_id is null then
    makeup_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', makeup_id, 'authenticated', 'authenticated',
      'makeup.teste@autonomos.app', crypt('Teste@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (makeup_id::text, makeup_id,
      jsonb_build_object('sub', makeup_id::text, 'email', 'makeup.teste@autonomos.app'),
      'email', now(), now(), now());
  end if;

  insert into public.profiles (id, role, name, phone, gender, work_area, avatar_url, approval_status, onboarding_completed, updated_at)
  values (
    makeup_id, 'professional', 'Sara Make Up', '924567890', 'Feminino', 'Make Up',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    'approved', true, now()
  )
  on conflict (id) do update set
    role = 'professional', name = excluded.name, phone = excluded.phone, gender = excluded.gender,
    work_area = excluded.work_area, avatar_url = excluded.avatar_url,
    approval_status = 'approved', onboarding_completed = true, updated_at = now();
end $$;

-- Conferir o resultado:
select id, name, role, gender, work_area, approval_status
from public.profiles
where work_area in ('Pintura', 'Make Up')
order by work_area;
