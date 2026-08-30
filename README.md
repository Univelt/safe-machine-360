# Portal Univelt Machine Safety

Portal web B2B multiempresa para gestão de máquinas, riscos, documentos e atividades relacionadas à segurança NR-12.

## Estado atual

**Fase 2 — Banco PostgreSQL, autenticação e cadastros NR-12.**

Esta versão contém:

- PostgreSQL pronto para Amazon RDS;
- Login real com sessão httpOnly;
- Super Admin Univelt com visão global;
- Usuário de empresa com acesso só às máquinas do próprio tenant;
- Cadastro de empresas, usuários, máquinas, documentos, APR, checklist e plano de ação;
- Isolamento por `company_id` na aplicação, com RLS opcional no banco.

## Execução local

1. Copie `.env.example` para `.env`.
2. `npm ci`
3. `npm run db:up`
4. `npx prisma migrate dev --name init`
5. `npm run db:seed`
6. `npm run dev`
7. Abra `http://localhost:3000`

Acessos do seed:

- Admin Univelt (vê tudo): `admin@univelt.com.br` / `Univelt@Admin2026`
- Cliente Indústria Delta (só a própria empresa): `fernanda@industriadelta.com.br` / `Univelt@Cliente2026`
- Cliente Metalforte: `roberto@metalforte.com.br` / `Univelt@Cliente2026`

## Rotas

- `/login`
- `/` painel Univelt
- `/admin/empresas`, `/admin/usuarios`, `/admin/maquinas`, `/admin/historico`
- `/cliente` área da empresa
- `/cliente/maquinas` e `/cliente/maquinas/nova`
- `/cliente/maquinas/[id]` ficha NR-12, fotos, APR, checklist e plano de ação
- `/cliente/documentos`
- `/cliente/atividades`
- `/cliente/relatorios`
- `/apresentacao`

## Banco e RDS

Veja `docs/rds.md`. O schema está em `prisma/schema.prisma`.
