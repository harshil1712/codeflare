import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@cloudflare/kumo";
import { ArrowSquareOut, CloudArrowUp, DownloadSimple, Lock } from "@phosphor-icons/react";
import { authClient } from "../../lib/auth-client";
import { toastManager } from "../toast";
import type { ExportAction, ScreenshotOptions } from "../types";

interface ExportButtonProps {
  options: ScreenshotOptions;
  disabled?: boolean;
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `codeshot-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ExportButton({ options, disabled }: ExportButtonProps) {
  const [loadingAction, setLoadingAction] = useState<ExportAction | null>(null);
  const { data: session } = authClient.useSession();

  const isAuthenticated = !!session;

  const handleExport = async (action: ExportAction) => {
    if (!options.code) return;

    setLoadingAction(action);

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...options, action }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to generate screenshot");
      }

      if (action === "r2_only") {
        toastManager.add({ title: "Saved!", description: "View in Gallery →", type: "success" });
      } else {
        const blob = await response.blob();
        triggerDownload(blob);
        if (action === "r2_and_download") {
          toastManager.add({ title: "Saved!", description: "View in Gallery →", type: "success" });
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      toastManager.add({
        title: "Export failed",
        description: error instanceof Error
          ? error.message
          : "Failed to generate screenshot. Please try again.",
        type: "error",
        priority: "high",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const isDisabled = disabled || !options.code;

  return (
    <div className="export-buttons">
      {isAuthenticated ? (
        <>
          <Button
            onClick={() => handleExport("r2_only")}
            disabled={isDisabled || loadingAction !== null}
            variant="secondary"
            size="base"
            icon={<CloudArrowUp weight="bold" />}
          >
            {loadingAction === "r2_only" ? "Saving..." : "Save to R2"}
          </Button>

          <Button
            onClick={() => handleExport("r2_and_download")}
            disabled={isDisabled || loadingAction !== null}
            variant="secondary"
            size="base"
            icon={<ArrowSquareOut weight="bold" />}
          >
            {loadingAction === "r2_and_download" ? "Generating..." : "Save & Download"}
          </Button>
        </>
      ) : (
        <Link to="/login" className="export-signin-prompt">
          <Lock size={14} weight="bold" />
          Sign in to save screenshots
        </Link>
      )}

      <Button
        onClick={() => handleExport("download_only")}
        disabled={isDisabled || loadingAction !== null}
        variant="primary"
        size="base"
        icon={<DownloadSimple weight="bold" />}
      >
        {loadingAction === "download_only" ? "Generating..." : "Download"}
      </Button>
    </div>
  );
}

export default ExportButton;
