# Modelo inicial de ameaças

## Ativos prioritários

- Documentos técnicos e fotografias;
- Dados de máquinas e riscos;
- Identidades, sessões e associações com empresas;
- Histórico de auditoria;
- Segredos da infraestrutura.

## Ameaças prioritárias

1. Acesso cruzado entre empresas por manipulação de IDs;
2. Elevação indevida de perfil;
3. Download de arquivo de outro tenant;
4. Vazamento por cache compartilhado;
5. Upload malicioso;
6. Exposição de chaves administrativas no navegador;
7. Alteração ou eliminação do histórico;
8. Exportação em massa por perfil sem autorização.

## Controles previstos

- Autorização no caso de uso e RLS com negação por padrão;
- `company_id` obrigatório e integridade entre relações;
- Buckets privados e URLs temporárias após autorização;
- Validação de entrada e arquivos;
- Chaves administrativas exclusivas do servidor e uso excepcional;
- Auditoria imutável para clientes;
- Testes negativos automatizados com dois ou mais tenants.

Este documento deve ser revisto e ampliado na Fase 2, antes de qualquer dado real.
