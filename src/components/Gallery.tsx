import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Trash, X, ArrowsOut, Lock } from "@phosphor-icons/react";
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
      const data = await res.json() as GalleryResponse;
      // Sort newest first
      const sorted = [...data.screenshots].sort(
        (a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime(),
      );
      setScreenshots(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load screenshots");
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

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          <Link to="/login" className="gallery-auth-btn">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="gallery-error">
          <p>{error}</p>
          <button className="gallery-retry-btn" onClick={fetchScreenshots}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && screenshots.length === 0 && (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 32l10-8 8 6 6-5 12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="gallery-empty-title">No screenshots yet</p>
          <p className="gallery-empty-body">
            Use the <strong>Save to R2</strong> or <strong>Save &amp; Download</strong> buttons in the editor to save screenshots here.
          </p>
        </div>
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
                <span className="gallery-card-date">{formatDate(shot.uploaded)}</span>
                <span className="gallery-card-size">{formatSize(shot.size)}</span>
                <button
                  className="gallery-card-delete"
                  onClick={() => handleDelete(shot.key)}
                  disabled={deletingKey === shot.key}
                  aria-label="Delete screenshot"
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxKey && (
        <div
          className="gallery-lightbox"
          onClick={() => setLightboxKey(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
        >
          <div className="gallery-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="gallery-lightbox-close"
              onClick={() => setLightboxKey(null)}
              aria-label="Close preview"
            >
              <X size={20} weight="bold" />
            </button>
            <img
              src={imgUrl(lightboxKey)}
              alt="Full size screenshot"
              className="gallery-lightbox-img"
            />
            <div className="gallery-lightbox-footer">
              {(() => {
                const shot = screenshots.find((s) => s.key === lightboxKey);
                return shot ? (
                  <>
                    <span>{formatDate(shot.uploaded)}</span>
                    <span>{formatSize(shot.size)}</span>
                    <button
                      className="gallery-lightbox-delete"
                      onClick={() => handleDelete(lightboxKey)}
                      disabled={deletingKey === lightboxKey}
                    >
                      <Trash size={14} weight="bold" />
                      {deletingKey === lightboxKey ? "Deleting…" : "Delete"}
                    </button>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
