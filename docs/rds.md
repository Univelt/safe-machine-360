# Banco PostgreSQL e Amazon RDS

O portal usa PostgreSQL. Em desenvolvimento o banco sobe no Docker. Em produção o mesmo schema vai para o Amazon RDS.

## Local

1. Copie `.env.example` para `.env`.
2. Suba o Postgres: `npm run db:up`
3. Aplique o schema: `npx prisma migrate dev --name init`
4. Popule dados iniciais: `npm run db:seed`
5. Rode o app: `npm run dev`

## RDS

1. Crie uma instância PostgreSQL 16 no RDS, em subnet privada, com security group liberando a porta 5432 só para a aplicação.
2. Crie o banco `univelt`.
3. Defina `DATABASE_URL` no ambiente da aplicação:

```
postgresql://USUARIO:SENHA@SEU-ENDPOINT.rds.amazonaws.com:5432/univelt?sslmode=require
```

4. Defina `AUTH_SECRET` longo e aleatório e `AUTH_SECURE_COOKIE=true`.
5. No deploy, rode `npx prisma migrate deploy` e, na primeira vez, `npx prisma db seed`.
6. Opcional: execute `prisma/sql/rls.sql` para reforçar o isolamento por empresa no banco.

Arquivos, fotos e PDFs ainda não usam S3. O RDS guarda metadados, vínculos e o log de cadastro. Storage privado entra na etapa seguinte.
