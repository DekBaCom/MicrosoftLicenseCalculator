import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 480, margin: "48px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong / เกิดข้อผิดพลาด</h2>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>
          The page failed to load (often an outdated cached version). Reload to fetch the latest version.
        </p>
        <pre style={{ fontSize: 11, background: "#f1f5f9", padding: 8, borderRadius: 6, overflow: "auto", marginBottom: 12 }}>
          {String(this.state.error.message || this.state.error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontSize: 14 }}
        >
          Reload
        </button>
      </div>
    );
  }
}
