"use client";

import { useState } from "react";

type ChecklistResult = { check: string; passed: boolean; detail: string };

type AuditResponse = {
  auditId: string;
  title: string;
  score: number;
  checklist: ChecklistResult[];
  viewCount: number;
  likeCount: number;
};

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, targetKeyword, email })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong running that audit.");
        return;
      }

      setResult(data);
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>ClipCompass</h1>
        <p className="tagline">
          A free, instant SEO audit for any YouTube video — pulled straight from YouTube&apos;s own
          API, no guesswork.
        </p>
      </section>

      <section className="card">
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
          <label>
            Email (to save your results)
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Running audit..." : "Run free audit"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="card results">
          <h2>{result.title}</h2>
          <p className="score">
            Optimization score: <strong>{result.score}/100</strong>
          </p>
          <ul className="checklist">
            {result.checklist.map((item) => (
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
            {result.viewCount.toLocaleString()} views · {result.likeCount.toLocaleString()} likes
          </p>
        </section>
      )}
    </main>
  );
}
