"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, targetKeyword, email })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong running that audit.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>ClipCompass</h1>
        <p className="tagline">
          A free, instant SEO audit for any YouTube video — pulled straight from YouTube&apos;s own
          API, no guesswork. Enter your email to unlock your results and your free dashboard.
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
            Email (unlocks your results + dashboard)
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
    </main>
  );
}
