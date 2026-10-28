import { useState } from "react";
import { Button, LinkButton } from "@cloudflare/kumo";
import { CloudArrowUp, Copy, DownloadSimple, Lock } from "@phosphor-icons/react";
import { authClient } from "../../lib/auth-client";
import { toastManager } from "../toast";
import type { ExportAction, ScreenshotOptions } from "../types";

type PendingAction = ExportAction | "copy";

interface ExportButtonProps {
  options: ScreenshotOptions;
  disabled?: boolean;
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `codeflare-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function requestScreenshot(options: ScreenshotOptions, action: ExportAction) {
  const response = await fetch("/api/screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...options, action }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error || "Failed to generate screenshot");
  }
  return response;
}

function reportError(title: string, error: unknown) {
  console.error(`${title}:`, error);
  toastManager.add({
    title,
    description:
      error instanceof Error ? error.message : "Failed to generate screenshot. Please try again.",
    type: "error",
    priority: "high",
  });
}

function ExportButton({ options, disabled }: ExportButtonProps) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { data: session } = authClient.useSession();

  const isDisabled = disabled || !options.code || pending !== null;

  const handleDownload = async () => {
    setPending("download_only");
    try {
      const response = await requestScreenshot(options, "download_only");
      triggerDownload(await response.blob());
    } catch (error) {
      reportError("Export failed", error);
    } finally {
      setPending(null);
    }
  };

  const handleSave = async () => {
    setPending("r2_only");
    try {
      await requestScreenshot(options, "r2_only");
      toastManager.add({ title: "Saved to gallery", type: "success" });
    } catch (error) {
      reportError("Save failed", error);
    } finally {
      setPending(null);
    }
  };

  const handleCopy = async () => {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      reportError("Copy failed", new Error("Your browser can't copy images to the clipboard."));
      return;
    }
    setPending("copy");
    try {
      // Pass the pending blob straight to ClipboardItem so Safari keeps the user-gesture context.
      const blob = requestScreenshot(options, "download_only").then((res) => res.blob());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toastManager.add({ title: "Copied to clipboard", type: "success" });
    } catch (error) {
      reportError("Copy failed", error);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="export-actions">
      <Button
        variant="primary"
        className="export-primary"
        icon={DownloadSimple}
        loading={pending === "download_only"}
        disabled={isDisabled}
        onClick={handleDownload}
      >
        Download PNG
      </Button>

      <div className="export-secondary">
        {session ? (
          <Button
            icon={CloudArrowUp}
            size="sm"
            loading={pending === "r2_only"}
            disabled={isDisabled}
            onClick={handleSave}
          >
            Save to gallery
          </Button>
        ) : (
          <LinkButton href="/login" variant="secondary" size="sm" icon={Lock}>
            Sign in to save
          </LinkButton>
        )}
        <Button
          icon={Copy}
          size="sm"
          loading={pending === "copy"}
          disabled={isDisabled}
          onClick={handleCopy}
        >
          Copy image
        </Button>
      </div>
    </div>
  );
}

export default ExportButton;
