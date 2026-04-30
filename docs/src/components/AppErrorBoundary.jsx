import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown frontend error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Frontend runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            background:
              "radial-gradient(circle at 12% 0%, #4d0f75 0, #2a0442 44%, #1b032d 100%)",
            color: "#fff",
            fontFamily: "Manrope, Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              padding: "1.25rem",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Frontend error</h1>
            <p style={{ marginBottom: "0.75rem" }}>
              The website loaded, but a React runtime error prevented rendering.
            </p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "rgba(0,0,0,0.2)",
                padding: "0.9rem",
                borderRadius: "12px",
              }}
            >
              {this.state.errorMessage}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
