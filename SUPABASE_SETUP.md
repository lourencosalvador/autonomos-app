## Configuração do Supabase (Autenticação)

### Variáveis de ambiente (Expo)

Defina no seu ambiente (ou no EAS/Expo) as seguintes variáveis:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Exemplo:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Tabela `profiles`

O app espera uma tabela `profiles` com pelo menos:

- `id` (uuid, PK, igual ao `auth.users.id`)
- `role` (text) -> `client` | `professional`
- `name` (text)
- `phone` (text, opcional)
- `avatar_url` (text, opcional)
- `created_at` / `updated_at` (timestamps, opcional)
- (opcional) `gender` (text)
- (opcional) `birth_date` (date)
- (opcional) `work_area` (text)
- (opcional) `auto_accept_message` (text) -> mensagem padrão enviada ao aceitar pedido

RLS recomendado:
- Select/Update: apenas o próprio utilizador (`auth.uid() = id`)

SQL opcional para adicionar campos pessoais:

```sql
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists work_area text;
alter table public.profiles add column if not exists auto_accept_message text;
```

### Storage (Avatar)

Crie um bucket no Supabase Storage chamado **`avatars`** e marque como **Public** (para conseguirmos usar `getPublicUrl()`).

Se aparecer o erro **"new row violates row-level security policy"**, faltam políticas de RLS no Storage.

Políticas (recomendado, usando `owner`):

```sql
-- Ler (público) os ficheiros do bucket avatars
create policy "avatars_select_public"
on storage.objects for select
using (bucket_id = 'avatars');

-- Upload: apenas o utilizador logado pode inserir (owner = auth.uid())
create policy "avatars_insert_own"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid() = owner);

-- Update/Delete: apenas o utilizador logado pode alterar/apagar os seus ficheiros
create policy "avatars_update_own"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "avatars_delete_own"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid() = owner);
```

### Portfólio do prestador (Publicações + Estados)

Criar um bucket no Supabase Storage chamado **`portfolio`** e marcar como **Public** (para conseguirmos usar `getPublicUrl()`).

Políticas de Storage (recomendado):

```sql
-- Ler (público) os ficheiros do bucket portfolio
create policy "portfolio_select_public"
on storage.objects for select
using (bucket_id = 'portfolio');

-- Upload: apenas o utilizador logado pode inserir (owner = auth.uid())
create policy "portfolio_insert_own"
on storage.objects for insert
with check (bucket_id = 'portfolio' and auth.uid() = owner);

-- Update/Delete: apenas o utilizador logado pode alterar/apagar os seus ficheiros
create policy "portfolio_update_own"
on storage.objects for update
using (bucket_id = 'portfolio' and auth.uid() = owner);

create policy "portfolio_delete_own"
on storage.objects for delete
using (bucket_id = 'portfolio' and auth.uid() = owner);
```

Tabela `provider_posts` (publicações do prestador; usada para grid + estados/destaques):

```sql
create table if not exists public.provider_posts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text null,
  highlight_title text null, -- ex: "Elegância", "Destaques", etc
  post_type text not null default 'post' check (post_type in ('post','story')),
  created_at timestamptz not null default now()
);

-- Se a tabela já existe no teu projeto, adiciona a coluna (safe):
alter table public.provider_posts add column if not exists post_type text;
update public.provider_posts set post_type = 'post' where post_type is null;
alter table public.provider_posts
  add constraint provider_posts_post_type_check
  check (post_type in ('post','story'));

create index if not exists provider_posts_provider_id_idx on public.provider_posts (provider_id, created_at desc);

alter table public.provider_posts enable row level security;

-- SELECT: qualquer utilizador pode ver as publicações (perfil público do prestador)
drop policy if exists "provider_posts_select_public" on public.provider_posts;
create policy "provider_posts_select_public"
on public.provider_posts for select
using (true);

-- INSERT/UPDATE/DELETE: apenas o próprio prestador (auth.uid() = provider_id)
drop policy if exists "provider_posts_insert_owner" on public.provider_posts;
create policy "provider_posts_insert_owner"
on public.provider_posts for insert
with check (auth.uid() = provider_id);

drop policy if exists "provider_posts_update_owner" on public.provider_posts;
create policy "provider_posts_update_owner"
on public.provider_posts for update
using (auth.uid() = provider_id);

drop policy if exists "provider_posts_delete_owner" on public.provider_posts;
create policy "provider_posts_delete_owner"
on public.provider_posts for delete
using (auth.uid() = provider_id);
```

### Tabela `requests` (Pedidos de serviço)

O app vai usar uma tabela `public.requests` para armazenar os pedidos e seus estados:
- **Cliente** cria e consegue ver/apagar os seus pedidos
- **Prestador** consegue ver e atualizar o `status` (aceitar/rejeitar)

SQL recomendado (tabela + RLS):

```sql
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  client_name text not null,
  client_avatar_url text null,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  provider_name text not null,
  provider_avatar_url text null,
  service_name text not null,
  description text not null,
  location text null,
  service_date text null,
  service_time text null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled','completed')),
  -- Pagamentos (Stripe)
  price_amount int null, -- em "minor units" (ex: cents). Ex: 1000 = 10.00 (depende da moeda)
  currency text null, -- ex: 'usd'
  payment_status text null, -- ex: 'requires_payment_method' | 'processing' | 'succeeded' | 'canceled' | 'payment_failed'
  stripe_payment_intent_id text null,
  paid_at timestamptz null,
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  cancelled_at timestamptz null,
  completed_at timestamptz null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requests enable row level security;

-- SELECT: cliente ou prestador conseguem ver
create policy "requests_select_participants"
on public.requests for select
using (auth.uid() = client_id or auth.uid() = provider_id);

-- INSERT: apenas o cliente cria (client_id = auth.uid())
create policy "requests_insert_client"
on public.requests for insert
with check (auth.uid() = client_id);

-- UPDATE: cliente ou prestador podem atualizar (o app controla o que muda)
create policy "requests_update_participants"
on public.requests for update
using (auth.uid() = client_id or auth.uid() = provider_id);

-- DELETE: cliente OU prestador podem apagar (cancelamento)
drop policy if exists "requests_delete_client" on public.requests;
create policy "requests_delete_participants"
on public.requests for delete
using (auth.uid() = client_id or auth.uid() = provider_id);
```

### Pagamentos (Stripe)

O pagamento é criado no backend (Stripe Secret) e confirmado por Webhook. O app lê os pagamentos pelo Supabase para:
- mostrar o estado do pagamento no pedido
- calcular o saldo e o histórico na Carteira do prestador

```sql
-- Se a tabela requests já existir no teu projeto, adiciona as colunas (safe)
alter table public.requests add column if not exists price_amount int;
alter table public.requests add column if not exists currency text;
alter table public.requests add column if not exists payment_status text;
alter table public.requests add column if not exists stripe_payment_intent_id text;
alter table public.requests add column if not exists paid_at timestamptz;
alter table public.requests add column if not exists completed_at timestamptz;

-- Se a tua tabela requests já existia com CHECK antigo, substitui para incluir 'completed'
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests
  add constraint requests_status_check
  check (status in ('pending','accepted','rejected','cancelled','completed'));

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid null references public.requests(id) on delete cascade,
  client_id uuid null references public.profiles(id) on delete cascade,
  provider_id uuid null references public.profiles(id) on delete cascade,
  amount int not null,
  currency text not null,
  status text not null,
  stripe_payment_intent_id text not null unique,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_request_id_unique on public.payments (request_id);

alter table public.payments enable row level security;

-- SELECT: cliente ou prestador conseguem ver seus pagamentos
drop policy if exists "payments_select_participants" on public.payments;
create policy "payments_select_participants"
on public.payments for select
using (auth.uid() = client_id or auth.uid() = provider_id);

-- INSERT/UPDATE/DELETE: o app NÃO grava pagamentos direto (é o webhook/backend via service role)
-- (service role ignora RLS)
```

Para Connect (recebimentos/payout), adicionamos no `profiles`:

```sql
alter table public.profiles add column if not exists stripe_account_id text;
```

### Tabela `reviews` (Avaliações)

Após o prestador aceitar o pedido, o **cliente** pode avaliar o serviço (estrelas + comentário).
O **prestador** consegue ver todas as avaliações recebidas.

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  client_avatar_url text null,
  rating int not null check (rating between 1 and 5),
  comment text null,
  created_at timestamptz not null default now()
);

-- Garante 1 avaliação por pedido
create unique index if not exists reviews_request_id_unique on public.reviews (request_id);

alter table public.reviews enable row level security;

-- SELECT: cliente e prestador conseguem ver
drop policy if exists "reviews_select_participants" on public.reviews;
create policy "reviews_select_participants"
on public.reviews for select
using (auth.uid() = client_id or auth.uid() = provider_id);

-- INSERT: apenas o cliente pode criar, e só se o pedido for dele e estiver ACEITE ou CONCLUÍDO
drop policy if exists "reviews_insert_client_only" on public.reviews;
create policy "reviews_insert_client_only"
on public.reviews for insert
with check (
  auth.uid() = client_id
  and exists (
    select 1
    from public.requests r
    where r.id = request_id
      and r.client_id = auth.uid()
      and r.provider_id = provider_id
      and r.status in ('accepted','completed')
  )
);
```

### Login com Google / Apple (OAuth)

No Supabase Dashboard:
- **Authentication → Providers**: ative Google e/ou Apple
- **Authentication → URL Configuration**:
  - Adicione o redirect do app (Expo scheme): `autonomosapp://auth/callback`
  - Para **confirmação de email** e **reset password**, use o mesmo redirect `autonomosapp://auth/callback` (assim o app recebe o `code`).

No `app.json` o scheme já está configurado como `autonomosapp`.

### Expo Go vs Dev Client / Build (importante)

- **Expo Go**: o redirect precisa ser o proxy do Expo (ex: `https://auth.expo.io/@lorrys-dev/autonomos-app`). Adicione esse URL também na lista de Redirect URLs do Supabase.
- **Dev Client / Build**: use `autonomosapp://auth/callback`.
