# SKIPP Flow

Sistema interno da SKIPP Marketing para gestão da produção de conteúdo para Instagram:
clientes, projetos, conteúdos (roteiro, legenda, CTA), pipeline Kanban, calendário editorial,
tarefas com checklist, links de materiais e dashboard operacional.

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript (strict) + Vite |
| Estilo | Tailwind CSS v4 (tokens da marca em `src/index.css`) |
| Rotas | React Router |
| Formulários | React Hook Form + Zod |
| Banco e login | Supabase (PostgreSQL + Auth + RLS) |
| Kanban | @dnd-kit/core |
| Calendário | FullCalendar 7 |
| Ícones | Lucide |

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a chave publishable do Supabase
npm run dev                  # http://localhost:5173
```

Outros comandos:

```bash
npm run build    # verifica os tipos e gera a versão de produção em dist/
npm run preview  # serve a versão de produção localmente
npm run lint     # analisa o código com oxlint
```

## Estrutura

```
src/
  components/   peças de interface
    ui/         genéricas (Button, Modal, Form, Badge, estados de carregando/erro/vazio)
    layout/     menu lateral e cabeçalho
    auth/       AuthProvider (sessão do usuário)
    clients/ projects/ contents/ tasks/   componentes de cada módulo
  pages/        uma tela por rota
  routes/       mapa de rotas e proteção (ProtectedRoute)
  services/     todas as consultas ao Supabase, uma por módulo
  schemas/      validações Zod dos formulários
  hooks/        useAuth, useAsync, useToast, usePreferences...
  lib/          cliente Supabase, opções/rótulos, datas, erros
  types/        tipos gerados do banco e tipos de domínio
supabase/
  migrations/   SQL versionado do banco (aplicado em ordem)
```

## Banco de dados

As migrations em `supabase/migrations/` criam:

- `clients` → `projects` (1:N) → `contents` (projeto opcional) → `content_assets` (links)
- `tasks` (cliente, projeto e conteúdo opcionais) → `task_checklist_items`
- `activity_logs`, preenchida automaticamente por triggers
- `admins`, a lista de usuários com acesso

Regras de integridade garantidas pelo próprio banco:

- O projeto de um conteúdo/tarefa precisa ser do mesmo cliente (FK composta).
- Cliente com projetos/conteúdos não pode ser apagado (é arquivado).
- Excluir um projeto mantém seus conteúdos e tarefas, só remove o vínculo.
- `published_at`, `finished_at` e `completed_at` são preenchidos automaticamente pelo status.

## Segurança

- Todas as tabelas têm **RLS**. Só usuários presentes em `public.admins` leem ou escrevem.
- O frontend usa apenas a chave **publishable**. A `service_role` nunca vai para o código.
- `.env.local` está no `.gitignore`.

### Criar o usuário administrador

1. Supabase → **Authentication → Users → Add user → Create new user** (e-mail + senha, marque *Auto Confirm User*).
2. No **SQL Editor**, libere o acesso:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```
3. Desative o cadastro público: **Authentication → Sign In / Providers → desligue "Allow new users to sign up"**.

## Deploy na Vercel

1. Importe o repositório na Vercel (framework: **Vite**, detectado automaticamente).
2. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Faça o deploy. O `vercel.json` já redireciona todas as rotas para o `index.html` (necessário em SPA)
   e adiciona cabeçalhos de segurança.
4. No Supabase, em **Authentication → URL Configuration**, coloque a URL da Vercel em *Site URL*.
