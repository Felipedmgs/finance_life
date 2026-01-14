import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

const PIX_EMAIL = "felipedd@hotmail.com"; // <-- sua chave pix (email)
const WHATSAPP_PHONE = "5511989962875"; // ex: 5511999999999

//permite inserir conta no campo de custo
function parseExpressionBRL(input) {
  if (!input) return 0;

  // troca vírgula por ponto
  let expr = input.replace(/,/g, ".");

  // remove tudo que não seja número ou operador
  expr = expr.replace(/[^0-9+\-*/.]/g, "");

  // evita código malicioso
  if (!/^[0-9+\-*/.]+$/.test(expr)) return 0;

  try {
    // avalia somente a expressão matemática
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)();
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function parseBRL(value) {
  if (value == null) return 0;
  const cleaned = String(value)
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(n) {
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${Number(n || 0).toFixed(2)}`;
  }
}

function monthFirstDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function yyyyMmLabel(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}
function isPaid(paidUntilStr) {
  if (!paidUntilStr) return false;
  const today = new Date();
  const paidUntil = new Date(paidUntilStr + "T00:00:00");
  // pago se paid_until >= hoje (sem horas)
  return paidUntil >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function PaywallModal({ open, onClose, userEmail }) {
  if (!open) return null;

  const baseMsg =
    `Olá! Quero liberar o acesso por 30 dias no Orçamento Pessoal Simples.\n` +
    `Meu e-mail de login: ${userEmail || "(não informado)"}\n` +
    `Valor: R$ {VALOR}\n` +
    `Vou enviar o comprovante aqui.`;

  const waLink = (valor) => {
    const msg = baseMsg.replace("{VALOR}", String(valor).replace(".", ","));
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const copyPix = async () => {
    await navigator.clipboard.writeText(PIX_EMAIL);
    alert("Chave Pix copiada ✅");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#101826",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Salvar e ver histórico (30 dias)</h3>
        <p style={{ color: "#9fb0c0", lineHeight: 1.5 }}>
          Você pode usar o cálculo grátis. Para <strong>salvar mês a mês</strong> e ver seu
          dashboard, contribua com o valor que achar justo (mínimo <strong>R$ 4,90</strong>)
          pra manter o projeto no ar.
        </p>

        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 12,
            padding: 12,
            background: "rgba(0,0,0,.18)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#9fb0c0" }}>Chave Pix (e-mail)</div>
              <div style={{ fontWeight: 800 }}>{PIX_EMAIL}</div>
            </div>
            <button onClick={copyPix} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
              Copiar chave Pix
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <a
              href={waLink(4.9)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", padding: 12, borderRadius: 12, background: "rgba(34,197,94,.18)", color: "#e6edf3", fontWeight: 800, textAlign: "center" }}
            >
              Pagar R$ 4,90 (mínimo) e enviar comprovante
            </a>
            <a
              href={waLink(9.9)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", padding: 12, borderRadius: 12, background: "rgba(99,102,241,.25)", color: "#e6edf3", fontWeight: 800, textAlign: "center" }}
            >
              Pagar R$ 9,90 (recomendado) e enviar comprovante
            </a>
            <a
              href={waLink(19.9)}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", padding: 12, borderRadius: 12, background: "rgba(255,255,255,.08)", color: "#e6edf3", fontWeight: 800, textAlign: "center" }}
            >
              Pagar R$ 19,90 (apoio) e enviar comprovante
            </a>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthCard({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        alert("Conta criada! Agora faça login. ✅");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuthed?.(data.user);
      }
    } catch (e) {
      setErr(e?.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      <p className="muted">Email e senha. Simples.</p>

      <label className="label">
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@dominio.com" />
      </label>

      <label className="label">
        Senha
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
      </label>

      {err && <div className="alert bad"><strong>Ops</strong><p>{err}</p></div>}

      <button className="btn" onClick={submit} disabled={loading || !email || pass.length < 6}>
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>

      <p className="muted small" style={{ marginTop: 10 }}>
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <a href="#" onClick={(e) => (e.preventDefault(), setMode("signup"))}>
              Criar agora
            </a>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <a href="#" onClick={(e) => (e.preventDefault(), setMode("login"))}>
              Entrar
            </a>
          </>
        )}
      </p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { paid_until }
  const [loadingProfile, setLoadingProfile] = useState(true);

  // inputs
  const [income, setIncome] = useState("");
  const [fixed, setFixed] = useState("");
  const [variable, setVariable] = useState("");
  const [didCalc, setDidCalc] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);

  // dashboard data
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  const data = useMemo(() => {
    const renda = parseBRL(income);
    const fixos = parseExpressionBRL(fixed);
    const variaveis = parseExpressionBRL(variable);
    const totalGasto = fixos + variaveis;
    const sobra = renda - totalGasto;
    const comprometido = renda > 0 ? (totalGasto / renda) * 100 : 0;
    return { renda, fixos, variaveis, totalGasto, sobra, comprometido };
  }, [income, fixed, variable]);

  const paid = isPaid(profile?.paid_until);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function ensureProfile(userId) {
    // tenta buscar
    const { data: p, error: e1 } = await supabase
      .from("profiles")
      .select("user_id, paid_until")
      .eq("user_id", userId)
      .maybeSingle();

    if (e1) throw e1;

    if (p) return p;

    // cria se não existir
    const { data: ins, error: e2 } = await supabase
      .from("profiles")
      .insert({ user_id: userId })
      .select("user_id, paid_until")
      .single();

    if (e2) throw e2;
    return ins;
  }

  async function loadProfileAndBudgets() {
    if (!session?.user?.id) return;
    setLoadingProfile(true);
    try {
      const p = await ensureProfile(session.user.id);
      setProfile(p);
      if (isPaid(p?.paid_until)) {
        await loadBudgets();
      } else {
        setBudgets([]);
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadBudgets() {
    setLoadingBudgets(true);
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, month, income, fixed, variable, created_at")
        .order("month", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBudgets(false);
    }
  }

  useEffect(() => {
    if (session?.user?.id) loadProfileAndBudgets();
    else {
      setProfile(null);
      setBudgets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const status = useMemo(() => {
    if (!didCalc) return null;
    if (data.renda <= 0) return { type: "warn", title: "Informe sua renda", text: "Coloque sua renda mensal pra calcular certinho." };

    if (data.sobra >= 0) {
      const sugestao = Math.max(0, Math.floor(data.variaveis * 0.1));
      return {
        type: "ok",
        title: "Boa! Você consegue guardar dinheiro este mês ✅",
        text:
          `Sobra ${formatBRL(data.sobra)}. ` +
          (sugestao > 0 ? `Se reduzir 10% dos variáveis (~${formatBRL(sugestao)}), você guarda ainda mais.` : ""),
      };
    }

    return {
      type: "bad",
      title: "Atenção: você está gastando mais do que ganha ⚠️",
      text:
        `Está faltando ${formatBRL(Math.abs(data.sobra))}. ` +
        `Comece reduzindo variáveis e revise fixos (assinaturas/planos).`,
    };
  }, [didCalc, data]);

  async function onSaveMonth() {
    if (!session?.user?.id) {
      alert("Faça login para salvar seus meses.");
      return;
    }
    if (!paid) {
      setShowPaywall(true);
      return;
    }

    // salva/upsert do mês atual
    const m = monthFirstDay();
    const payload = {
      user_id: session.user.id,
      month: m.toISOString().slice(0, 10),
      income: Number(data.renda.toFixed(2)),
      fixed: Number(data.fixos.toFixed(2)),
      variable: Number(data.variaveis.toFixed(2)),
    };

    const { error } = await supabase.from("budgets").upsert(payload, {
      onConflict: "user_id,month",
    });

    if (error) {
      // se pagar expirou, o RLS bloqueia e cai aqui
      console.error(error);
      setShowPaywall(true);
      return;
    }

    alert("Mês salvo ✅");
    await loadBudgets();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const summary = useMemo(() => {
    if (!budgets?.length) return null;
    const rows = budgets.map((b) => {
      const total = Number(b.fixed) + Number(b.variable);
      const sobra = Number(b.income) - total;
      return { ...b, total, sobra };
    });
    const last = rows[0];
    const best = rows.reduce((acc, cur) => (cur.sobra > acc.sobra ? cur : acc), rows[0]);
    const avg = rows.reduce((s, r) => s + r.sobra, 0) / rows.length;
    return { last, best, avg };
  }, [budgets]);

  return (
    <div className="page">
      <header className="header">
        <div className="badge">Orçamento Pessoal Simples</div>
        <h1>Organize seu orçamento em 5 minutos</h1>
        <p>
          Calcule grátis. Para salvar mês a mês e ver o dashboard, liberação por <strong>30 dias</strong> via Pix.
        </p>

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {session?.user ? (
            <>
              <span className="muted small">Logado: {session.user.email}</span>
              <span className="muted small">
                Status: {paid ? `✅ Liberado até ${profile?.paid_until}` : "🔒 Não liberado"}
              </span>
              <button className="btn" style={{ width: "auto" }} onClick={signOut}>
                Sair
              </button>
            </>
          ) : (
            <span className="muted small">Faça login para salvar seu histórico.</span>
          )}
        </div>
      </header>

      <main className="grid">
        {!session?.user ? (
          <AuthCard onAuthed={() => {}} />
        ) : (
          <section className="card">
            <h2>Calculadora</h2>
            <p className="muted">Preencha renda, fixos e variáveis e veja o resultado.</p>

            <label className="label">
              Renda mensal (R$)
              <input inputMode="decimal" placeholder="Ex: 3500" value={income} onChange={(e) => setIncome(e.target.value)} />
            </label>

            <div className="row">
              <label className="label">
                Gastos fixos (R$)
                <input inputMode="decimal" placeholder="Ex: 1800" value={fixed} onChange={(e) => setFixed(e.target.value)} />
              </label>

              <label className="label">
                Gastos variáveis (R$)
                <input inputMode="decimal" placeholder="Ex: 900" value={variable} onChange={(e) => setVariable(e.target.value)} />
              </label>
            </div>

            <button className="btn" onClick={() => setDidCalc(true)}>
              Calcular
            </button>

            {didCalc && (
              <>
                <div className="stats">
                  <div className="stat">
                    <span className="k">Total gasto</span>
                    <span className="v">{formatBRL(data.totalGasto)}</span>
                  </div>
                  <div className="stat">
                    <span className="k">Sobra / Falta</span>
                    <span className="v">{formatBRL(data.sobra)}</span>
                  </div>
                  <div className="stat">
                    <span className="k">% comprometido</span>
                    <span className="v">{data.comprometido.toFixed(1)}%</span>
                  </div>
                </div>

                {status && (
                  <div className={`alert ${status.type}`}>
                    <strong>{status.title}</strong>
                    <p>{status.text}</p>
                  </div>
                )}

                <button className="btn" onClick={onSaveMonth}>
                  Salvar mês (histórico)
                </button>

                <p className="muted small" style={{ marginTop: 10 }}>
                  🔒 Seus dados ficam no seu usuário. Só você vê.
                </p>
              </>
            )}
          </section>
        )}

        <section className="card">
          <h2>Dashboard (mês a mês)</h2>

          {!session?.user ? (
            <p className="muted">Entre para salvar e visualizar seu histórico.</p>
          ) : loadingProfile ? (
            <p className="muted">Carregando status...</p>
          ) : !paid ? (
            <p className="muted">Seu histórico aparece aqui quando o acesso for liberado.</p>
          ) : loadingBudgets ? (
            <p className="muted">Carregando meses...</p>
          ) : budgets.length === 0 ? (
            <p className="muted">Ainda não tem meses salvos. Calcule e clique em “Salvar mês”.</p>
          ) : (
            <>
              {summary && (
                <div className="stats">
                  <div className="stat">
                    <span className="k">Último mês ({yyyyMmLabel(new Date(summary.last.month))})</span>
                    <span className="v">{formatBRL(Number(summary.last.income) - (Number(summary.last.fixed) + Number(summary.last.variable)))}</span>
                  </div>
                  <div className="stat">
                    <span className="k">Melhor mês ({yyyyMmLabel(new Date(summary.best.month))})</span>
                    <span className="v">{formatBRL(summary.best.sobra)}</span>
                  </div>
                  <div className="stat">
                    <span className="k">Média de sobra</span>
                    <span className="v">{formatBRL(summary.avg)}</span>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {budgets.map((b) => {
                  const total = Number(b.fixed) + Number(b.variable);
                  const sobra = Number(b.income) - total;
                  return (
                    <div key={b.id} className="stat">
                      <span className="k">{yyyyMmLabel(new Date(b.month))}</span>
                      <span className="v">{sobra >= 0 ? "Sobra " : "Falta "}{formatBRL(Math.abs(sobra))}</span>
                      <span className="muted small">
                        Renda {formatBRL(Number(b.income))} • Gasto {formatBRL(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        userEmail={session?.user?.email}
      />
    </div>
  );
}
