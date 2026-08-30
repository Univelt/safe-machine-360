import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const adminPassword = "Univelt@Admin2026";
const clientPassword = "Univelt@Cliente2026";

async function main() {
  const passwordHash = {
    admin: await hash(adminPassword, 12),
    client: await hash(clientPassword, 12),
  };

  await prisma.auditLog.deleteMany();
  await prisma.complianceSnapshot.deleteMany();
  await prisma.actionPlanItem.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.checklistItemAnswer.deleteMany();
  await prisma.checklistExecution.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.activityAttachment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.machinePhoto.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.company.deleteMany();

  const delta = await prisma.company.create({
    data: {
      id: "ind-delta",
      name: "Indústria Delta",
      legalName: "Indústria Delta S.A.",
      cnpj: "12.345.678/0001-90",
      city: "Campinas, SP",
      manager: "Fernanda Oliveira",
      status: "ACTIVE",
    },
  });
  const metalforte = await prisma.company.create({
    data: {
      id: "metalforte",
      name: "Metalforte Componentes",
      legalName: "Metalforte Componentes Ltda.",
      cnpj: "45.682.110/0001-24",
      city: "Jundiaí, SP",
      manager: "Roberto Nunes",
      status: "ACTIVE",
    },
  });
  const demo = await prisma.company.create({
    data: {
      id: "demo-univelt",
      name: "Empresa Demonstração",
      legalName: "Empresa Demonstração Univelt Ltda.",
      cnpj: "00.000.000/0001-00",
      city: "São Paulo, SP",
      manager: "Ana Ribeiro",
      status: "DEMO",
    },
  });

  const campinas = await prisma.unit.create({ data: { id: "unit-campinas", companyId: delta.id, name: "Campinas", city: "Campinas, SP" } });
  const jundiaiDelta = await prisma.unit.create({ data: { id: "unit-jundiai-delta", companyId: delta.id, name: "Jundiaí", city: "Jundiaí, SP" } });
  await prisma.unit.create({ data: { id: "unit-sumare", companyId: delta.id, name: "Sumaré", city: "Sumaré, SP" } });
  const jundiaiMetal = await prisma.unit.create({ data: { id: "unit-jundiai-metal", companyId: metalforte.id, name: "Jundiaí", city: "Jundiaí, SP" } });
  await prisma.unit.create({ data: { id: "unit-itu", companyId: metalforte.id, name: "Itu", city: "Itu, SP" } });
  const spDemo = await prisma.unit.create({ data: { id: "unit-sp-demo", companyId: demo.id, name: "São Paulo", city: "São Paulo, SP" } });
  await prisma.unit.create({ data: { id: "unit-osasco", companyId: demo.id, name: "Osasco", city: "Osasco, SP" } });

  await prisma.user.createMany({
    data: [
      { name: "Paulo Almeida", email: "admin@univelt.com.br", passwordHash: passwordHash.admin, role: "SUPER_ADMIN", status: "ACTIVE", lastAccessAt: new Date() },
      { name: "Ana Ribeiro", email: "ana.ribeiro@univelt.com.br", passwordHash: passwordHash.admin, role: "SUPER_ADMIN", status: "ACTIVE", lastAccessAt: new Date() },
      { name: "Fernanda Oliveira", email: "fernanda@industriadelta.com.br", passwordHash: passwordHash.client, role: "CLIENT_ADMIN", status: "ACTIVE", companyId: delta.id, unitId: campinas.id, lastAccessAt: new Date() },
      { name: "Mariana Costa", email: "mariana@industriadelta.com.br", passwordHash: passwordHash.client, role: "CLIENT_MANAGER", status: "ACTIVE", companyId: delta.id, unitId: campinas.id },
      { name: "Carlos Mendes", email: "carlos@industriadelta.com.br", passwordHash: passwordHash.client, role: "VIEWER", status: "ACTIVE", companyId: delta.id, unitId: campinas.id },
      { name: "Roberto Nunes", email: "roberto@metalforte.com.br", passwordHash: passwordHash.client, role: "CLIENT_ADMIN", status: "ACTIVE", companyId: metalforte.id, unitId: jundiaiMetal.id },
      { name: "Juliana Prado", email: "juliana@metalforte.com.br", passwordHash: passwordHash.client, role: "CLIENT_MANAGER", status: "INVITED", companyId: metalforte.id, unitId: jundiaiMetal.id },
      { name: "Usuário Demonstração", email: "demo@univelt.local", passwordHash: passwordHash.client, role: "VIEWER", status: "ACTIVE", companyId: demo.id, unitId: spDemo.id },
    ],
  });

  const machines = [
    { id: "maq-0198", companyId: delta.id, unitId: campinas.id, code: "MAQ-0198", name: "Prensa Hidráulica PH-400", tag: "PRE-042", sector: "Estamparia", area: "Linha 2", manufacturer: "Hidraumak", model: "PH-400", year: 2017, riskLevel: "MUITO_ALTO" as const, status: "OPERACIONAL" as const, description: "Prensa hidráulica utilizada na conformação de componentes metálicos da linha de estampagem.", serial: "PH4-17-00982", energySources: "Elétrica e hidráulica", hrnCurrent: 420, hrnResidual: 80, category: "CAT_4" as const, machineType: "Prensa hidráulica", assetTag: "PRE-042", documentNumber: "APR-0198", documentRevision: "3.0", capacity: "400 t" },
    { id: "maq-0141", companyId: delta.id, unitId: campinas.id, code: "MAQ-0141", name: "Guilhotina Industrial GSI 3200", tag: "GUI-018", sector: "Corte", area: "Preparação", manufacturer: "Newton", model: "GSI 3200", year: 2019, riskLevel: "ALTO" as const, status: "OPERACIONAL" as const, description: "Equipamento destinado ao corte de chapas metálicas para preparação de componentes.", serial: "NT-GSI-3200-441", energySources: "Elétrica e pneumática", hrnCurrent: 280, hrnResidual: 90, category: "CAT_3" as const, machineType: "Guilhotina", assetTag: "GUI-018", documentNumber: "APR-0141", documentRevision: "6.0", capacity: "3200 mm" },
    { id: "maq-0087", companyId: metalforte.id, unitId: jundiaiMetal.id, code: "MAQ-0087", name: "Torno CNC TC-800", tag: "TOR-087", sector: "Usinagem", area: "Célula CNC", manufacturer: "Romi", model: "Centur 80", year: 2021, riskLevel: "ALTO" as const, status: "OPERACIONAL" as const, description: "Torno CNC para usinagem de eixos e componentes de precisão.", serial: "ROM-C80-21087", energySources: "Elétrica", hrnCurrent: 245, hrnResidual: 70, category: "CAT_3" as const, machineType: "Torno CNC", assetTag: "TOR-087", documentNumber: "APR-0087", documentRevision: "2.1" },
    { id: "maq-0074", companyId: delta.id, unitId: campinas.id, code: "MAQ-0074", name: "Esteira Transportadora ET-12", tag: "EST-205", sector: "Expedição", area: "Doca 3", manufacturer: "Movepack", model: "ET-12", year: 2020, riskLevel: "SIGNIFICATIVO" as const, status: "OPERACIONAL" as const, description: "Esteira modular para movimentação de volumes até a área de expedição.", serial: "MP-ET12-205", energySources: "Elétrica", hrnCurrent: 165, hrnResidual: 55, category: "CAT_2" as const, machineType: "Esteira", assetTag: "EST-205", documentNumber: "APR-0074", documentRevision: "2.0" },
    { id: "maq-0164", companyId: demo.id, unitId: spDemo.id, code: "MAQ-0164", name: "Misturador Industrial MI-05", tag: "MIS-005", sector: "Processo", area: "Preparação", manufacturer: "Marconi", model: "MA-500", year: 2018, riskLevel: "SIGNIFICATIVO" as const, status: "OPERACIONAL" as const, description: "Misturador vertical para homogeneização de insumos do processo produtivo.", serial: "MAR-MA500-055", energySources: "Elétrica", hrnCurrent: 140, hrnResidual: 45, category: "CAT_2" as const, machineType: "Misturador", assetTag: "MIS-005" },
    { id: "maq-0026", companyId: metalforte.id, unitId: jundiaiMetal.id, code: "MAQ-0026", name: "Furadeira de Coluna FC-40", tag: "FUR-026", sector: "Ferramentaria", area: "Bancada 4", manufacturer: "Kone", model: "FC-40", year: 2015, riskLevel: "BAIXO" as const, status: "OPERACIONAL" as const, description: "Furadeira de coluna para serviços de manutenção e ferramentaria.", serial: "KON-FC40-263", energySources: "Elétrica", hrnCurrent: 65, hrnResidual: 20, category: "B" as const, machineType: "Furadeira", assetTag: "FUR-026" },
    { id: "maq-0210", companyId: delta.id, unitId: campinas.id, code: "MAQ-0210", name: "Compressor de Parafuso CP-75", tag: "COM-075", sector: "Utilidades", area: "Casa de máquinas", manufacturer: "Atlas Copco", model: "GA 75", year: 2022, riskLevel: "BAIXO" as const, status: "EM_MANUTENCAO" as const, description: "Compressor responsável pelo fornecimento de ar comprimido para a unidade.", serial: "AC-GA75-22190", energySources: "Elétrica e pneumática", hrnCurrent: 72, hrnResidual: 25, category: "CAT_1" as const, machineType: "Compressor", assetTag: "COM-075" },
    { id: "maq-0049", companyId: metalforte.id, unitId: jundiaiMetal.id, code: "MAQ-0049", name: "Serra Fita Horizontal SF-280", tag: "SER-049", sector: "Corte", area: "Preparação", manufacturer: "Franho", model: "FM-280", year: 2016, riskLevel: "ALTO" as const, status: "INTERDITADA" as const, description: "Serra fita para corte de perfis e tarugos metálicos.", serial: "FR-FM280-16049", energySources: "Elétrica e hidráulica", hrnCurrent: 230, hrnResidual: 80, category: "CAT_3" as const, machineType: "Serra fita", assetTag: "SER-049" },
    { id: "maq-0122", companyId: demo.id, unitId: spDemo.id, code: "MAQ-0122", name: "Paletizadora Automática PA-02", tag: "PAL-002", sector: "Embalagem", area: "Final de linha", manufacturer: "Robopac", model: "Helix PA", year: 2023, riskLevel: "SIGNIFICATIVO" as const, status: "OPERACIONAL" as const, description: "Sistema automatizado para formação e organização de paletes.", serial: "RP-HPA-23002", energySources: "Elétrica e pneumática", hrnCurrent: 128, hrnResidual: 40, category: "CAT_2" as const, machineType: "Paletizadora", assetTag: "PAL-002" },
    { id: "maq-0183", companyId: delta.id, unitId: campinas.id, code: "MAQ-0183", name: "Elevador de Carga EC-01", tag: "ELV-001", sector: "Logística", area: "Armazém", manufacturer: "Montele", model: "EC 2000", year: 2014, riskLevel: "MUITO_ALTO" as const, status: "INTERDITADA" as const, description: "Elevador industrial para movimentação vertical de cargas entre pavimentos.", serial: "MON-EC2K-1401", energySources: "Elétrica", hrnCurrent: 390, hrnResidual: 90, category: "CAT_4" as const, machineType: "Elevador de carga", assetTag: "ELV-001" },
    {
      id: "maq-ebi01",
      companyId: delta.id,
      unitId: campinas.id,
      code: "EBI-01",
      name: "Inspetora Eletrônica EBI 01",
      tag: "EBI-01",
      sector: "Inspeção",
      area: "Linha 01",
      manufacturer: "HEUFT",
      model: "INLINE II IXS",
      year: 2020,
      riskLevel: "ALTO" as const,
      status: "OPERACIONAL" as const,
      description: "Inspetora eletrônica de garrafas vazias da linha 01, com proteções, intertravamentos e painel elétrico NR-12.",
      serial: "ALEUIP5001001",
      energySources: "Elétrica, mecânica e pneumática",
      hrnCurrent: 80,
      hrnResidual: 20,
      category: "CAT_3" as const,
      machineType: "Inspeção de garrafas",
      assetTag: "012721",
      documentNumber: "APR-EBI-01",
      documentRevision: "1.0",
      capacity: "Linha 01",
      mainSystems: "Proteções fixas, proteções móveis com intertravamento, botão de emergência, chave seccionadora com bloqueio LOTO.",
      usage: "Conferência das garrafas vazias para utilização.",
      processCharacteristics: "Processo automático, abastecimento automático e descarga automática.",
      operatorCount: 1,
      operatorSkills: "Curso de NR-12 e treinamento específico no equipamento.",
      mechMaintenanceCount: 1,
      mechMaintenanceSkills: "Curso de NR-12, conhecimento de mecânica industrial e noções de funcionamento do equipamento.",
      elecMaintenanceCount: 1,
      elecMaintenanceSkills: "Curso de NR-10, curso de NR-12, conhecimento de elétrica industrial, programação de CLP e noções de funcionamento do equipamento.",
      equipmentLimits: "Fonte elétrica, mecânica e pneumática. Operação com 1 operador. Manutenção mecânica e elétrica com 1 manutentor cada.",
      observations: "Cadastro completo conforme ficha NR-12 da apresentação R04, incluindo fotos, APR, checklist e plano de ação.",
    },
  ];

  for (const machine of machines) {
    await prisma.machine.create({ data: machine });
  }

  await prisma.machinePhoto.createMany({
    data: [
      { machineId: "maq-ebi01", kind: "FRONT", caption: "Frontal" },
      { machineId: "maq-ebi01", kind: "BACK", caption: "Traseira" },
      { machineId: "maq-ebi01", kind: "LEFT", caption: "Lateral esquerda" },
      { machineId: "maq-ebi01", kind: "RIGHT", caption: "Lateral direita" },
      { machineId: "maq-ebi01", kind: "ELECTRICAL_PANEL", caption: "Painel elétrico principal" },
      { machineId: "maq-ebi01", kind: "ID_PLATE", caption: "Placa de identificação" },
    ],
  });

  await prisma.document.createMany({
    data: [
      { id: "doc-001", companyId: delta.id, machineId: "maq-0198", name: "Apreciação de risco — PH-400", type: "APRECIACAO_RISCO", version: "3.0", issueDate: new Date("2025-07-23"), expirationDate: new Date("2026-07-23"), responsible: "Eng. Ricardo Lima", size: "4,8 MB", description: "Análise de perigos, estimativa HRN e recomendações de adequação conforme NR-12." },
      { id: "doc-002", companyId: delta.id, machineId: "maq-0141", name: "Checklist de segurança — GSI 3200", type: "CHECKLIST_SEGURANCA", version: "6.0", issueDate: new Date("2025-08-04"), expirationDate: new Date("2026-08-04"), responsible: "Mariana Costa", size: "1,2 MB", description: "Checklist periódico dos dispositivos, proteções e condições operacionais do equipamento." },
      { id: "doc-003", companyId: metalforte.id, machineId: "maq-0087", name: "Manual de operação — TC-800", type: "MANUAL", version: "2.1", issueDate: new Date("2021-02-10"), expirationDate: null, responsible: "Fabricante Romi", size: "12,6 MB", description: "Manual técnico de instalação, operação, ajustes e manutenção preventiva." },
      { id: "doc-004", companyId: delta.id, machineId: "maq-0074", name: "Apreciação de risco — ET-12", type: "APRECIACAO_RISCO", version: "2.0", issueDate: new Date("2025-08-16"), expirationDate: new Date("2026-08-16"), responsible: "Eng. Ricardo Lima", size: "3,1 MB", description: "Avaliação de riscos mecânicos e elétricos da esteira e interfaces com a doca." },
      { id: "doc-005", companyId: demo.id, machineId: "maq-0164", name: "Checklist de manutenção — MI-05", type: "CHECKLIST_MANUTENCAO", version: "4.0", issueDate: new Date("2026-04-22"), expirationDate: new Date("2026-10-22"), responsible: "Carlos Mendes", size: "860 KB", description: "Registro de inspeção preventiva dos sistemas mecânico, elétrico e de bloqueio." },
      { id: "doc-006", companyId: metalforte.id, machineId: "maq-0026", name: "Laudo de adequação NR-12 — FC-40", type: "LAUDO", version: "1.0", issueDate: new Date("2026-03-18"), expirationDate: new Date("2027-03-18"), responsible: "Eng. Ana Ribeiro", size: "2,7 MB", description: "Laudo conclusivo das adequações implantadas e evidências de conformidade." },
      { id: "doc-007", companyId: delta.id, machineId: "maq-0210", name: "Checklist de segurança — CP-75", type: "CHECKLIST_SEGURANCA", version: "3.0", issueDate: new Date("2026-02-19"), expirationDate: new Date("2026-08-19"), responsible: "Paulo Nogueira", size: "940 KB", description: "Verificação de dispositivos de pressão, emergência e sinalização do compressor." },
      { id: "doc-008", companyId: metalforte.id, machineId: "maq-0049", name: "Apreciação de risco — SF-280", type: "APRECIACAO_RISCO", version: "2.0", issueDate: new Date("2026-01-08"), expirationDate: new Date("2027-01-08"), responsible: "Eng. Ricardo Lima", size: "3,9 MB", description: "Apreciação de risco com plano de ação para proteções e intertravamentos." },
      { id: "doc-009", companyId: demo.id, machineId: "maq-0122", name: "ART de inspeção — PA-02", type: "ART", version: "1.0", issueDate: new Date("2026-04-25"), expirationDate: null, responsible: "Eng. Ana Ribeiro", size: "420 KB", description: "Anotação de responsabilidade técnica vinculada à inspeção da paletizadora." },
      { id: "doc-010", companyId: delta.id, machineId: "maq-0183", name: "Checklist de segurança — EC-01", type: "CHECKLIST_SEGURANCA", version: "5.0", issueDate: new Date("2026-01-02"), expirationDate: new Date("2026-07-02"), responsible: "Mariana Costa", size: "1,4 MB", description: "Inspeção dos elementos de elevação, portas, intertravamentos e parada de emergência." },
      { id: "doc-011", companyId: delta.id, machineId: "maq-ebi01", name: "APR — Inspetora EBI 01", type: "APR", version: "1.0", issueDate: new Date("2026-01-15"), expirationDate: new Date("2027-01-15"), responsible: "Eng. Ricardo Lima", size: "5,1 MB", description: "Apreciação de risco da inspetora eletrônica, com categoria de segurança, HRN atual e residual." },
    ],
  });

  await prisma.riskAssessment.create({
    data: {
      companyId: delta.id,
      machineId: "maq-ebi01",
      documentNumber: "APR-EBI-01",
      revision: "1.0",
      category: "CAT_3",
      hrnCurrent: 80,
      hrnResidual: 20,
      riskLevel: "ALTO",
      issuedAt: new Date("2026-01-15"),
      expiresAt: new Date("2027-01-15"),
      notes: "Categoria 3. HRN atual 80 e residual 20 após proteções previstas no plano de ação.",
    },
  });

  const template = await prisma.checklistTemplate.create({
    data: {
      id: "tpl-nr12-preliminar",
      companyId: null,
      name: "Check list preliminar de segurança – NR 12",
      description: "Modelo global cadastrado no banco. Pode ser preenchido em qualquer máquina e novos itens podem ser adicionados.",
      items: {
        create: [
          { number: 1, description: "Os comandos do quadro elétrico estão sinalizados/identificados" },
          { number: 2, description: "Os comandos de operação estão alimentados em extra baixa tensão" },
          { number: 3, description: "Os dispositivos de partida e parada possuem redundância no acionamento" },
          { number: 4, description: "A inversão do motor elétrico da máquina não causa acidente ao operador" },
          { number: 5, description: "Os componentes e circuitos internos do quadro elétrico possuem sinalização de identificação" },
          { number: 6, description: "Os barramentos energizados no interior do quadro elétrico possuem proteção fixa que abrange totalmente a área de risco" },
          { number: 7, description: "Não há acúmulo de cabos elétricos no interior do quadro elétrico" },
          { number: 8, description: "Não há acúmulo/guarda/depósito de materiais e objetos no interior do quadro elétrico" },
        ],
      },
    },
    include: { items: true },
  });

  const execution = await prisma.checklistExecution.create({
    data: {
      companyId: delta.id,
      machineId: "maq-ebi01",
      templateId: template.id,
      executedBy: "Fernanda Oliveira",
      notes: "Primeiro preenchimento com log de cadastro.",
      answers: {
        create: [
          { itemId: template.items[0].id, result: "SIM" },
          { itemId: template.items[1].id, result: "SIM" },
          { itemId: template.items[2].id, result: "SIM" },
          { itemId: template.items[3].id, result: "NA" },
          { itemId: template.items[4].id, result: "PARCIAL" },
          { itemId: template.items[5].id, result: "PARCIAL" },
          { itemId: template.items[6].id, result: "PARCIAL" },
          { itemId: template.items[7].id, result: "PARCIAL" },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: delta.id,
      action: "CHECKLIST_CREATED",
      entity: "ChecklistExecution",
      entityId: execution.id,
      summary: "Checklist preliminar NR-12 cadastrado para EBI-01 por Fernanda Oliveira.",
    },
  });

  await prisma.actionPlan.create({
    data: {
      companyId: delta.id,
      machineId: "maq-ebi01",
      title: "Plano de ação EBI 01 — Linha 01",
      items: {
        create: [
          { sequence: 1, location: "Perigo mecânico", nonconformity: "Ponto de esmagamento na entrada/saída de garrafas.", action: "Instalar proteções móveis ou fixas conforme NR-12.", reference: "Projeto conceitual", responsible: "FORNECEDOR", status: "ABERTA" },
          { sequence: 5, location: "Perigo elétrico", nonconformity: "Botões de reset de segurança ausentes.", action: "Instalar botões de reset frontal e traseiro.", reference: "Projeto conceitual", responsible: "FORNECEDOR", status: "EM_ANDAMENTO" },
          { sequence: 10, location: "Sinalização", nonconformity: "Sinalização de segurança pouco visível.", action: "Instalar torre de sinalização e identificação de perigos.", reference: "NR-12", responsible: "FORNECEDOR", status: "ABERTA" },
          { sequence: 12, location: "Documentação", nonconformity: "Diagramas elétricos e pneumáticos desatualizados.", action: "Atualizar diagramas e emitir manuais/procedimentos.", reference: "Documentação NR-12", responsible: "Indústria Delta", status: "ABERTA" },
        ],
      },
    },
  });

  await prisma.activity.createMany({
    data: [
      { id: "ati-001", companyId: delta.id, machineId: "maq-0198", title: "Renovar apreciação de risco", type: "Atualização documental", description: "Revisar perigos, recalcular HRN e emitir nova versão da apreciação de risco.", responsible: "Eng. Ricardo Lima", responsibleEmail: "ricardo@univelt.com.br", createdOn: new Date("2026-07-24"), dueDate: new Date("2026-07-29"), status: "EM_ANDAMENTO", priority: "CRITICA", progress: 60 },
      { id: "ati-002", companyId: delta.id, machineId: "maq-0141", title: "Executar checklist periódico", type: "Checklist", description: "Inspecionar proteções, cortina de luz, comando bimanual e parada de emergência.", responsible: "Mariana Costa", responsibleEmail: "mariana@industriadelta.com.br", createdOn: new Date("2026-07-25"), dueDate: new Date("2026-08-04"), status: "ABERTA", priority: "ALTA", progress: 0 },
      { id: "ati-003", companyId: delta.id, machineId: "maq-0074", title: "Corrigir proteção lateral", type: "Ação corretiva", description: "Substituir proteção lateral danificada e registrar evidência fotográfica da adequação.", responsible: "Carlos Mendes", responsibleEmail: "carlos@industriadelta.com.br", createdOn: new Date("2026-07-20"), dueDate: new Date("2026-07-28"), status: "EM_ANDAMENTO", priority: "ALTA", progress: 35 },
      { id: "ati-004", companyId: demo.id, machineId: "maq-0164", title: "Inspecionar sistema de bloqueio", type: "Inspeção", description: "Validar pontos de bloqueio e procedimento LOTO antes da manutenção programada.", responsible: "Paulo Nogueira", createdOn: new Date("2026-07-18"), dueDate: new Date("2026-07-25"), status: "ATRASADA", priority: "CRITICA", progress: 20 },
      { id: "ati-005", companyId: delta.id, machineId: "maq-0210", title: "Manutenção preventiva trimestral", type: "Manutenção", description: "Troca de filtros, verificação de válvulas e inspeção dos dispositivos de pressão.", responsible: "Equipe de Utilidades", createdOn: new Date("2026-07-15"), dueDate: new Date("2026-07-27"), executedAt: new Date("2026-07-26"), status: "CONCLUIDA", priority: "MEDIA", progress: 100 },
      { id: "ati-006", companyId: metalforte.id, machineId: "maq-0049", title: "Instalar intertravamento da tampa", type: "Adequação NR-12", description: "Instalar chave de segurança codificada e validar parada segura na abertura da tampa.", responsible: "Equipe Univelt", responsibleEmail: "ana.ribeiro@univelt.com.br", createdOn: new Date("2026-07-22"), dueDate: new Date("2026-08-12"), status: "ABERTA", priority: "ALTA", progress: 0 },
      { id: "ati-007", companyId: demo.id, machineId: "maq-0122", title: "Treinar operadores da célula", type: "Treinamento", description: "Realizar treinamento de operação segura, intervenção e resposta a emergências.", responsible: "Fernanda Oliveira", createdOn: new Date("2026-07-21"), dueDate: new Date("2026-08-08"), status: "EM_ANDAMENTO", priority: "MEDIA", progress: 45 },
      { id: "ati-008", companyId: delta.id, machineId: "maq-0183", title: "Revisar portas de pavimento", type: "Ação corretiva", description: "Corrigir folgas e validar todos os intertravamentos antes de retirar a interdição.", responsible: "Fornecedor Elevatec", createdOn: new Date("2026-07-19"), dueDate: new Date("2026-08-02"), status: "EM_ANDAMENTO", priority: "CRITICA", progress: 70 },
      { id: "ati-009", companyId: delta.id, machineId: "maq-ebi01", title: "Executar plano de ação da EBI 01", type: "Plano de ação", description: "Acompanhar proteções, reset de segurança, sinalização e atualização documental da inspetora.", responsible: "Fernanda Oliveira", responsibleEmail: "fernanda@industriadelta.com.br", createdOn: new Date("2026-08-10"), dueDate: new Date("2026-09-15"), status: "EM_ANDAMENTO", priority: "ALTA", progress: 25 },
    ],
  });

  await prisma.activityAttachment.createMany({
    data: [
      { activityId: "ati-001", name: "Relatório de inspeção preliminar.pdf", kind: "DOC" },
      { activityId: "ati-001", name: "Foto da proteção existente.jpg", kind: "PHOTO" },
      { activityId: "ati-001", name: "HRN calculado.xlsx", kind: "DOC" },
      { activityId: "ati-003", name: "Registro fotográfico da intervenção", kind: "PHOTO" },
      { activityId: "ati-003", name: "Ordem de serviço.pdf", kind: "DOC" },
      { activityId: "ati-005", name: "Checklist de manutenção.pdf", kind: "DOC" },
    ],
  });

  await prisma.complianceSnapshot.createMany({
    data: [
      { companyId: delta.id, month: "Fev", score: 72 },
      { companyId: delta.id, month: "Mar", score: 75 },
      { companyId: delta.id, month: "Abr", score: 78 },
      { companyId: delta.id, month: "Mai", score: 81 },
      { companyId: delta.id, month: "Jun", score: 83 },
      { companyId: delta.id, month: "Jul", score: 86 },
      { companyId: metalforte.id, month: "Jul", score: 79 },
      { companyId: demo.id, month: "Jul", score: 92 },
    ],
  });

  console.log("Seed concluído.");
  console.log("Admin:  admin@univelt.com.br / Univelt@Admin2026");
  console.log("Cliente Delta: fernanda@industriadelta.com.br / Univelt@Cliente2026");
  console.log("Cliente Metalforte: roberto@metalforte.com.br / Univelt@Cliente2026");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
