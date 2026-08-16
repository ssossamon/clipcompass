"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ChecklistResult = { check: string; passed: boolean; detail: string };

type Audit = {
  id: string;
  videoUrl: string;
  title: string;
  optimizationScore: number;
  createdAt: string;
};

type SessionUser = { id: string; email: string; planTier: string };

type SessionResponse = {
  user: SessionUser | null;
  audits?: Audit[];
  limits?: {
    auditsUsed: number;
    auditLimit: number | null;
    keywordsUsed: number;
    keywordLimit: number | null;
  };
};

type Tab = "audit" | "keywords" | "rank" | "account";

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("audit");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [videoUrl, setVideoUrl] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{
    title: string;
    score: number;
    checklist: ChecklistResult[];
    viewCount: number;
    likeCount: number;
  } | null>(null);

  const [seedKeyword, setSeedKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [keywordResult, setKeywordResult] = useState<{
    suggestions: string[];
    note: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data: SessionResponse) => {
        if (!data.user) {
          router.push("/");
          return;
        }
        setSession(data);
      })
      .finally(() => setLoadingSession(false));
  }, [router]);

  function refreshSession() {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data: SessionResponse) => setSession(data));
  }

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setAuditLoading(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, targetKeyword, email: session?.user?.email })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuditError(data.error ?? "Something went wrong.");
        return;
      }
      setAuditResult(data);
      refreshSession();
    } catch {
      setAuditError("Couldn't reach the server. Try again.");
    } finally {
      setAuditLoading(false);
    }
  }

  async function runKeywordSearch(e: React.FormEvent) {
    e.preventDefault();
    setKeywordLoading(true);
    setKeywordError(null);
    setKeywordResult(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedKeyword })
      });
      const data = await res.json();
      if (!res.ok) {
        setKeywordError(data.error ?? "Something went wrong.");
        return;
      }
      setKeywordResult(data);
      refreshSession();
    } catch {
      setKeywordError("Couldn't reach the server. Try again.");
    } finally {
      setKeywordLoading(false);
    }
  }

  async function upgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Billing isn't set up yet.");
    }
  }

  async function logOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  if (loadingSession) {
    return (
      <main className="page">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (!session?.user) return null;

  const { user, limits } = session;
  const isPro = user.planTier !== "free";

  return (
    <main className="page dashboard">
      <nav className="dash-nav">
        <div className="dash-brand">ClipCompass</div>
        <div className="dash-tabs">
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>
            Video Audit
          </button>
          <button className={tab === "keywords" ? "active" : ""} onClick={() => setTab("keywords")}>
            Keywords
          </button>
          <button className={tab === "rank" ? "active" : ""} onClick={() => setTab("rank")}>
            Rank Tracking
          </button>
          <button className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}>
            Account
          </button>
        </div>
        <div className="dash-user">
          <span>{user.email}</span>
          <span className={`plan-badge ${isPro ? "pro" : "free"}`}>{isPro ? "Pro" : "Free"}</span>
          <button className="link-btn" onClick={logOut}>
            Log out
          </button>
        </div>
      </nav>

      {tab === "audit" && (
        <section className="card">
          <h2>Run a video audit</h2>
          {limits && limits.auditLimit !== null && (
            <p className="usage">
              {limits.auditsUsed}/{limits.auditLimit} free audits used this month
            </p>
          )}
          <form onSubmit={runAudit} className="audit-form">
            <label>
              YouTube video URL
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
              />
            </label>
            <label>
              Target keyword
              <input
                type="text"
                placeholder="e.g. affiliate marketing for beginners"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              />
            </label>
            <button type="submit" disabled={auditLoading}>
              {auditLoading ? "Running audit..." : "Run audit"}
            </button>
          </form>
          {auditError && (
            <p className="error">
              {auditError}{" "}
              {auditError.toLowerCase().includes("upgrade") && (
                <button className="link-btn" onClick={upgrade}>
                  Upgrade now
                </button>
              )}
            </p>
          )}

          {auditResult && (
            <div className="results">
              <h3>{auditResult.title}</h3>
              <p className="score">
                Optimization score: <strong>{auditResult.score}/100</strong>
              </p>
              <ul className="checklist">
                {auditResult.checklist.map((item) => (
                  <li key={item.check} className={item.passed ? "pass" : "fail"}>
                    <span className="icon">{item.passed ? "✓" : "✗"}</span>
                    <div>
                      <p className="check-label">{item.check}</p>
                      {item.detail && <p className="check-detail">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="stats">
                {auditResult.viewCount.toLocaleString()} views · {auditResult.likeCount.toLocaleString()} likes
              </p>
            </div>
          )}

          {session.audits && session.audits.length > 0 && (
            <div className="history">
              <h3>Past audits</h3>
              <ul className="history-list">
                {session.audits.map((a) => (
                  <li key={a.id}>
                    <span className="history-title">{a.title}</span>
                    <span className="history-score">{a.optimizationScore}/100</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {tab === "keywords" && (
        <section className="card">
          <h2>Keyword research</h2>
          {limits && limits.keywordLimit !== null && (
            <p className="usage">
              {limits.keywordsUsed}/{limits.keywordLimit} free searches used this month
            </p>
          )}
          <form onSubmit={runKeywordSearch} className="audit-form">
            <label>
              Seed keyword
              <input
                type="text"
                placeholder="e.g. youtube seo"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={keywordLoading}>
              {keywordLoading ? "Searching..." : "Get suggestions"}
            </button>
          </form>
          {keywordError && (
            <p className="error">
              {keywordError}{" "}
              {keywordError.toLowerCase().includes("upgrade") && (
                <button className="link-btn" onClick={upgrade}>
                  Upgrade now
                </button>
              )}
            </p>
          )}
          {keywordResult && (
            <div className="results">
              <ul className="keyword-list">
                {keywordResult.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="check-detail">{keywordResult.note}</p>
            </div>
          )}
        </section>
      )}

      {tab === "rank" && (
        <section className="card locked">
          <h2>Rank tracking</h2>
          <p>
            Connect your channel and automatically track how your videos rank for your target
            keywords over time.
          </p>
          {isPro ? (
            <p className="check-detail">Coming soon for Pro accounts — we&apos;ll notify you by email.</p>
          ) : (
            <button className="upgrade-btn" onClick={upgrade}>
              Upgrade to Pro to unlock
            </button>
          )}
        </section>
      )}

      {tab === "account" && (
        <section className="card">
          <h2>Account</h2>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <p>
            Plan: <strong>{isPro ? "Pro" : "Free"}</strong>
          </p>
          {!isPro && (
            <button className="upgrade-btn" onClick={upgrade}>
              Upgrade to Pro
            </button>
          )}
        </section>
      )}
    </main>
  );
}
