import { useState } from "react";
import { Button } from "@cloudflare/kumo";
import { ArrowSquareOut, CloudArrowUp, DownloadSimple } from "@phosphor-icons/react";
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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (action: ExportAction) => {
    if (!options.code) return;

    setLoadingAction(action);

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...options, action }),
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to generate screenshot");
      }

      if (action === "r2_only") {
        showToast("Saved to R2!");
      } else {
        const blob = await response.blob();
        triggerDownload(blob);
        if (action === "r2_and_download") {
          showToast("Saved to R2!");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate screenshot. Please try again."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const isDisabled = disabled || !options.code;

  return (
    <div className="export-buttons">
      {toast && <p className="export-toast">{toast}</p>}

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
