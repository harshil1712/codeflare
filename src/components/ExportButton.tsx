import { useState } from "react";
import { Button } from "@cloudflare/kumo";
import type { ScreenshotOptions } from "../types";

interface ExportButtonProps {
  options: ScreenshotOptions;
  disabled?: boolean;
}

function ExportButton({ options, disabled }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    if (!options.code) {
      alert("Please enter some code first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate screenshot");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codeshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate screenshot. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isLoading || !options.code}
      className="export-button"
    >
      {isLoading ? "Generating..." : "Export Screenshot"}
    </Button>
  );
}

export default ExportButton;
