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

RLS recomendado:
- Select/Update: apenas o próprio utilizador (`auth.uid() = id`)

SQL opcional para adicionar campos pessoais:

```sql
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists work_area text;
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
