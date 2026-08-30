# ADR 0001 — Monólito modular e infraestrutura portável

- **Status:** aceita para a fundação; revisão antes da Fase 2
- **Data:** 26/07/2026

## Contexto

O portal precisa atender várias empresas com isolamento rigoroso, mas ainda está em fase inicial. Também deve permitir implantação futura em Azure ou AWS.

## Decisão

Usar um monólito modular em Next.js, com PostgreSQL como fonte de verdade e Supabase como plataforma inicial prevista. Regras de domínio não dependerão diretamente dos SDKs de identidade ou armazenamento.

O build será executável em contêiner e configurado por variáveis de ambiente. Banco, identidade, arquivos e telemetria terão contratos próprios quando forem implementados.

## Consequências

- Menor complexidade operacional no MVP;
- Transações e autorização mais simples de auditar;
- Migração futura exige novos adaptadores, mas não reescrita da interface e do domínio;
- RLS e migração de identidade precisarão de atenção especial no desenho da Fase 2.
