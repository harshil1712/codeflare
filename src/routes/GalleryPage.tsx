import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Trash, ArrowsOut, Lock, Image } from "@phosphor-icons/react";
import { Banner, Button, Dialog, Empty } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";
import type { ScreenshotMeta } from "../types";

interface GalleryResponse {
  screenshots: ScreenshotMeta[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GalleryPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [screenshots, setScreenshots] = useState<ScreenshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);

  const isAuthenticated = !!session;

  const fetchScreenshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/screenshots", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load screenshots");
      const data = (await res.json()) as GalleryResponse;
      // Sort newest first
      const sorted = [...data.screenshots].sort(
        (a, b) =>
          new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime(),
      );
      setScreenshots(sorted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load screenshots",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchScreenshots();
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [fetchScreenshots, isAuthenticated, sessionLoading]);

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await fetch(`/api/screenshots/${encodeURIComponent(key)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete screenshot");
      setScreenshots((prev) => prev.filter((s) => s.key !== key));
      if (lightboxKey === key) setLightboxKey(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingKey(null);
    }
  };

  const imgUrl = (key: string) => `/api/screenshots/${encodeURIComponent(key)}`;

  // Show sign-in prompt for unauthenticated users
  if (!sessionLoading && !isAuthenticated) {
    return (
      <div className="gallery-page">
        <div className="gallery-auth-prompt">
          <div className="gallery-auth-icon">
            <Lock size={40} weight="bold" />
          </div>
          <h2 className="gallery-auth-title">Sign in to view your gallery</h2>
          <p className="gallery-auth-body">
            Your saved screenshots are private. Sign in to access them.
          </p>
          <Link to="/login">
            <Button variant="primary">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  const lightboxShot = screenshots.find((s) => s.key === lightboxKey);

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div>
          <h2 className="gallery-title">Saved Screenshots</h2>
          <p className="gallery-subtitle">
            {loading
              ? "Loading…"
              : `${screenshots.length} screenshot${screenshots.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
      </div>

      {error && (
        <Banner variant="error" className="gallery-error-banner">
          {error}
          <Button
            variant="secondary-destructive"
            size="sm"
            onClick={fetchScreenshots}
          >
            Retry
          </Button>
        </Banner>
      )}

      {!loading && !error && screenshots.length === 0 && (
        <Empty
          icon={<Image size={48} weight="thin" />}
          title="No screenshots yet"
          description='Use the "Save to R2" or "Save & Download" buttons in the editor to save screenshots here.'
          size="lg"
        />
      )}

      {!loading && screenshots.length > 0 && (
        <div className="gallery-grid">
          {screenshots.map((shot) => (
            <div key={shot.key} className="gallery-card">
              <button
                className="gallery-card-thumb"
                onClick={() => setLightboxKey(shot.key)}
                aria-label="View full size"
              >
                <img
                  src={imgUrl(shot.key)}
                  alt={`Screenshot saved ${formatDate(shot.uploaded)}`}
                  className="gallery-card-img"
                  loading="lazy"
                />
                <div className="gallery-card-overlay">
                  <ArrowsOut size={22} weight="bold" />
                </div>
              </button>
              <div className="gallery-card-info">
                <span className="gallery-card-date">
                  {formatDate(shot.uploaded)}
                </span>
                <span className="gallery-card-size">
                  {formatSize(shot.size)}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  shape="square"
                  icon={Trash}
                  onClick={() => handleDelete(shot.key)}
                  disabled={deletingKey === shot.key}
                  aria-label="Delete screenshot"
                  className="gallery-card-delete"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog.Root
        open={!!lightboxKey}
        onOpenChange={(open) => {
          if (!open) setLightboxKey(null);
        }}
      >
        <Dialog size="xl" className="gallery-lightbox-dialog">
          <button
            className="gallery-lightbox-close"
            onClick={() => setLightboxKey(null)}
            aria-label="Close preview"
          >
            ×
          </button>
          {lightboxKey && (
            <img
              src={imgUrl(lightboxKey)}
              alt="Full size screenshot"
              className="gallery-lightbox-img"
            />
          )}
          {lightboxShot && (
            <div className="gallery-lightbox-footer">
              <span>{formatDate(lightboxShot.uploaded)}</span>
              <span>{formatSize(lightboxShot.size)}</span>
              <Button
                variant="destructive"
                size="sm"
                icon={Trash}
                onClick={() => handleDelete(lightboxKey!)}
                disabled={deletingKey === lightboxKey}
                className="gallery-lightbox-delete-btn"
              >
                {deletingKey === lightboxKey ? "Deleting…" : "Delete"}
              </Button>
            </div>
          )}
        </Dialog>
      </Dialog.Root>
    </div>
  );
}

export default GalleryPage;
