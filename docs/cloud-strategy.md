# Estratégia de portabilidade

O ambiente inicial previsto utiliza Supabase, mantendo PostgreSQL como base portável.

| Capacidade | Inicial | Azure | AWS |
|---|---|---|---|
| Aplicação | Contêiner Next.js | Container Apps/App Service | ECS Fargate/App Runner |
| Banco | Supabase PostgreSQL | Azure Database for PostgreSQL | RDS PostgreSQL |
| Arquivos | Supabase Storage | Blob Storage | S3 |
| Segredos | Ambiente protegido | Key Vault | Secrets Manager |
| Telemetria | Logs estruturados | Azure Monitor | CloudWatch |
| Identidade | Supabase Auth | Entra External ID/OIDC | Cognito/OIDC |

Portabilidade significa evitar a reescrita do domínio. A troca de identidade, storage e propagação do contexto RLS continuará exigindo migração planejada e testada.
