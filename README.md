# Orçamento Pessoal Simples

MVP de um mini-SaaS para orçamento pessoal: o usuário calcula grátis e, ao pagar (Pix manual), pode **salvar mês a mês** e ver um **dashboard simples**.  
Backend pronto com **Supabase (Auth + Postgres + RLS)**.

## ✨ Funcionalidades

- ✅ Login / Cadastro com **email e senha** (Supabase Auth)
- ✅ Calculadora: renda, gastos fixos e variáveis
- ✅ Campos aceitam expressões (ex: `10+20+160`) para somar gastos
- ✅ Salvar orçamento do mês (1 registro por mês)
- ✅ Dashboard mês a mês + resumo (último mês, melhor mês, média)
- ✅ Paywall: salvar/histórico só com acesso liberado
- ✅ Liberação **manual via Pix** por **30 dias** usando `paid_until`
- ✅ Segurança real no banco com **RLS** (não dá pra burlar pelo front)

---

## 🧱 Stack

- **Frontend:** React + Vite
- **Backend:** Supabase
  - Auth (email/senha)
  - Postgres
  - Row Level Security (RLS)

---

## 🚀 Rodando localmente

### 1) Clonar e instalar
```bash
git clone <SEU_REPO_AQUI>
cd <PASTA_DO_PROJETO>
npm install
