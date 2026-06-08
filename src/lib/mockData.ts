export type Status = "development" | "stable" | "paused" | "archived";
export type TestStatus = "running" | "completed" | "failed";

export const projects = [
  { id: "p1", name: "Automated NOC Sync", category: "Infraestrutura", status: "development" as Status, version: "v0.8.2", description: "Integração entre Supabase e N8N para monitoramento de infraestrutura em tempo real e alertas automáticos.", tech: ["N8N", "PostgreSQL", "Supabase"], goal: "Centralizar alertas de infra", updatedAt: "2026-06-07" },
  { id: "p2", name: "Knowledge Base AI", category: "IA", status: "stable" as Status, version: "v1.4.0", description: "Assistente técnico baseado em GPT-4 treinado sobre os módulos internos de soluções.", tech: ["OpenAI", "Python", "LangChain"], goal: "Consultas técnicas instantâneas", updatedAt: "2026-06-05" },
  { id: "p3", name: "Evolution Bridge", category: "Integração", status: "development" as Status, version: "v0.3.1", description: "Ponte WhatsApp via Evolution API para disparos e atendimento automatizado.", tech: ["Evolution API", "Node.js", "Redis"], goal: "Automatizar atendimento WhatsApp", updatedAt: "2026-06-06" },
  { id: "p4", name: "Infra Scanner", category: "Segurança", status: "paused" as Status, version: "v2.0.0-rc1", description: "Scanner de portas e vulnerabilidades para redes corporativas internas.", tech: ["Go", "Docker", "Nmap"], goal: "Auditoria de rede contínua", updatedAt: "2026-05-28" },
  { id: "p5", name: "Google Workspace Sync", category: "Integração", status: "stable" as Status, version: "v1.1.0", description: "Sincronização de usuários, grupos e calendários do Google Workspace com base interna.", tech: ["Google API", "TypeScript"], goal: "Single source of truth de usuários", updatedAt: "2026-06-01" },
  { id: "p6", name: "VargasTI Portal", category: "Plataforma", status: "development" as Status, version: "v0.1.0", description: "Esta plataforma — central de conhecimento e laboratório pessoal.", tech: ["TanStack", "React", "Tailwind"], goal: "Knowledge hub pessoal", updatedAt: "2026-06-08" },
];

export const solutions = [
  { id: "s1", title: "Resetar senha de usuário AD via PowerShell", category: "Procedimento", tags: ["AD", "PowerShell", "Windows"], summary: "Script + passo a passo para resetar senhas em massa no Active Directory.", updatedAt: "2026-06-04" },
  { id: "s2", title: "Configurar cluster PostgreSQL com replicação", category: "Tutorial", tags: ["PostgreSQL", "Linux", "HA"], summary: "Setup completo de replicação streaming com failover automático via Patroni.", updatedAt: "2026-06-02" },
  { id: "s3", title: "Erro 0x80070005 ao instalar Windows Update", category: "Correção", tags: ["Windows", "Troubleshooting"], summary: "Causas comuns e fluxo de resolução validado em produção.", updatedAt: "2026-05-30" },
  { id: "s4", title: "Migração de e-mail Exchange → Google Workspace", category: "Caso de Sucesso", tags: ["Migração", "Google", "Exchange"], summary: "Projeto de migração de 250 caixas com zero downtime percebido.", updatedAt: "2026-05-20" },
  { id: "s5", title: "Hardening de servidores Ubuntu 24.04", category: "Procedimento", tags: ["Linux", "Segurança", "Ubuntu"], summary: "Checklist CIS aplicado via Ansible com relatório de compliance.", updatedAt: "2026-05-15" },
];

export const labTests = [
  { id: "t1", name: "LLM Latency Stress Test", environment: "AWS-Lambda-01", status: "completed" as TestStatus, result: "142ms avg", category: "IA", updatedAt: "2026-06-07" },
  { id: "t2", name: "Vector DB Clustering", environment: "Pinecone-Standard", status: "running" as TestStatus, result: "98% precision", category: "IA", updatedAt: "2026-06-08" },
  { id: "t3", name: "API Gateway Auth v2", environment: "Staging-Edge", status: "failed" as TestStatus, result: "Auth Timeout", category: "Integração", updatedAt: "2026-06-06" },
  { id: "t4", name: "N8N Workflow Throughput", environment: "Self-hosted-01", status: "running" as TestStatus, result: "1.2k req/min", category: "Automação", updatedAt: "2026-06-08" },
  { id: "t5", name: "Evolution API Concurrent Sessions", environment: "Docker-Local", status: "completed" as TestStatus, result: "120 sessões OK", category: "Integração", updatedAt: "2026-06-05" },
];

export const scripts = [
  { id: "sc1", name: "Cleanup_logs.ps1", language: "PowerShell", description: "Limpa logs antigos do Windows Event Viewer com filtro por idade.", code: `Get-EventLog -LogName Application -Before (Get-Date).AddDays(-30) |\n  Remove-Event -Confirm:$false` },
  { id: "sc2", name: "backup_postgres.sh", language: "Bash", description: "Backup completo PostgreSQL com upload para S3.", code: `#!/bin/bash\npg_dump -Fc mydb | gzip > /tmp/db.dump.gz\naws s3 cp /tmp/db.dump.gz s3://backups/$(date +%F).gz` },
  { id: "sc3", name: "top_users.sql", language: "SQL", description: "Retorna top 10 usuários por atividade nos últimos 30 dias.", code: `SELECT user_id, COUNT(*) AS actions\nFROM activity_log\nWHERE created_at > NOW() - INTERVAL '30 days'\nGROUP BY user_id\nORDER BY actions DESC\nLIMIT 10;` },
  { id: "sc4", name: "sync_users.py", language: "Python", description: "Sincroniza usuários do Google Workspace com base local.", code: `from google.oauth2 import service_account\n# ... auth ...\nfor user in service.users().list().execute()['users']:\n    upsert(user)` },
  { id: "sc5", name: "debounce.js", language: "JavaScript", description: "Utilitário debounce sem dependências.", code: `export const debounce = (fn, ms = 300) => {\n  let t;\n  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };\n};` },
];

export const docs = [
  { id: "d1", title: "Topologia de rede — Matriz", category: "Redes", summary: "Diagrama lógico e físico da rede principal." },
  { id: "d2", title: "Política de backup corporativa", category: "Segurança", summary: "Frequência, retenção e procedimentos de restore." },
  { id: "d3", title: "Inventário de servidores", category: "Infraestrutura", summary: "Lista de servidores físicos e virtuais com specs." },
  { id: "d4", title: "Procedimento de onboarding TI", category: "Sistemas", summary: "Fluxo de criação de usuários e provisão de equipamentos." },
  { id: "d5", title: "Manual switch Cisco Catalyst", category: "Equipamentos", summary: "Configurações padrão e troubleshooting." },
  { id: "d6", title: "Hardening Linux baseline", category: "Segurança", summary: "Configurações mínimas de segurança aplicadas." },
];

export const tools = [
  { id: "t1", name: "N8N", category: "Automação", url: "https://n8n.io", description: "Workflow automation low-code.", favorite: true },
  { id: "t2", name: "Evolution API", category: "Mensageria", url: "https://evolution-api.com", description: "API WhatsApp não-oficial.", favorite: true },
  { id: "t3", name: "Supabase", category: "Backend", url: "https://supabase.com", description: "Postgres + Auth + Storage gerenciado.", favorite: true },
  { id: "t4", name: "Notion", category: "Documentação", url: "https://notion.so", description: "Notas e bases de conhecimento.", favorite: false },
  { id: "t5", name: "Portainer", category: "DevOps", url: "https://portainer.io", description: "Gerenciamento visual de containers.", favorite: false },
  { id: "t6", name: "Grafana", category: "Observabilidade", url: "https://grafana.com", description: "Dashboards e métricas.", favorite: true },
];

export const ideas = [
  { id: "i1", title: "Bot de triagem automática de chamados via IA", priority: "Alta", status: "Em análise", description: "Classificar e rotear chamados usando LLM local." },
  { id: "i2", title: "Integração Evolution + N8N + Supabase", priority: "Alta", status: "Planejado", description: "Pipeline completo de atendimento omnichannel." },
  { id: "i3", title: "Dashboard de custos de cloud unificado", priority: "Média", status: "Backlog", description: "AWS + GCP + Azure em uma visão única." },
  { id: "i4", title: "Mobile app para a VargasTI", priority: "Baixa", status: "Backlog", description: "Acesso rápido a scripts e docs no celular." },
  { id: "i5", title: "CLI vargasti para criar/listar entradas", priority: "Média", status: "Em análise", description: "Ferramenta de linha de comando para produtividade." },
];

export const recentActivity = [
  { time: "14:02:12", type: "success", title: "Script Executado", detail: "Cleanup_logs.ps1 finalizado em 1.4s" },
  { time: "13:45:50", type: "info", title: "Documentação Atualizada", detail: '"PostgreSQL Cluster Setup" publicado' },
  { time: "12:30:00", type: "neutral", title: "Nova Ideia", detail: "Mobile App Integration — Prioridade: Média" },
  { time: "11:18:44", type: "success", title: "Teste Concluído", detail: "LLM Latency Stress Test — 142ms avg" },
  { time: "10:02:11", type: "warning", title: "Teste em Execução", detail: "Vector DB Clustering iniciado" },
  { time: "09:30:00", type: "info", title: "Projeto Atualizado", detail: "Knowledge Base AI → v1.4.0" },
];
