import { Component } from "react";
import { Button } from "@cloudflare/kumo";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          textAlign: "center",
        }}>
          <h1>Something went wrong</h1>
          <p style={{ marginTop: "1rem", color: "rgba(255, 255, 255, 0.7)" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            variant="secondary"
            size="base"
            onClick={() => window.location.reload()}
            style={{ marginTop: "2rem" }}
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
