import { useState, useEffect, useCallback, useRef } from "react";
import { Image, Lock, MagnifyingGlass, Trash, X } from "@phosphor-icons/react";
import {
  Banner,
  Button,
  Dialog,
  Empty,
  InputGroup,
  LinkButton,
  Loader,
  Text,
} from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";
import GalleryCard from "../components/GalleryCard";
import type { ScreenshotMeta, SearchResponse } from "../types";

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

async function fetchScreenshots(signal: AbortSignal): Promise<ScreenshotMeta[]> {
  const res = await fetch("/api/screenshots", { credentials: "include", signal });
  if (!res.ok) throw new Error("Failed to load screenshots");
  const data = (await res.json()) as GalleryResponse;
  // Sort newest first
  return [...data.screenshots].sort(
    (a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime(),
  );
}

function GalleryPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [screenshots, setScreenshots] = useState<ScreenshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isAuthenticated = !!session;

  // Unauthenticated users get an early-return sign-in prompt, so `loading`
  // only matters once a session exists. State is only set once the request
  // settles; bumping `reloadCount` re-runs the fetch.
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    fetchScreenshots(controller.signal)
      .then((shots) => {
        setScreenshots(shots);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load screenshots");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadCount]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setReloadCount((n) => n + 1);
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        credentials: "include",
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Search failed");
      }
      const data = (await res.json()) as SearchResponse;
      setSearchResults(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  // Cleanup debounce timer and any in-flight search on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      // performSearch handles its own errors
      void performSearch(value);
    }, 600);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  };

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
        <Empty
          size="lg"
          className="gallery-empty"
          icon={<Lock size={40} weight="duotone" />}
          title="Sign in to view your gallery"
          description="Your saved screenshots are private. Sign in to access them."
          contents={
            <LinkButton href="/login" variant="primary">
              Sign in
            </LinkButton>
          }
        />
      </div>
    );
  }

  // For the lightbox footer, look in the full screenshots list first,
  // then fall back to search results (which won't have date/size metadata).
  const lightboxShot = screenshots.find((s) => s.key === lightboxKey);

  const isSearchActive = searchQuery.trim().length > 0;
  const resultCount = searchResults?.data.length ?? 0;

  const subtitle = loading
    ? "Loading…"
    : isSearchActive && searchResults
      ? `${resultCount} result${resultCount !== 1 ? "s" : ""} found`
      : `${screenshots.length} screenshot${screenshots.length !== 1 ? "s" : ""} saved`;

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div>
          <Text variant="heading" size="lg" as="h1">
            Gallery
          </Text>
          <Text variant="secondary" size="sm">
            {subtitle}
          </Text>
        </div>

        <InputGroup className="gallery-search">
          <InputGroup.Addon>
            {searching ? <Loader size={14} /> : <MagnifyingGlass size={16} />}
          </InputGroup.Addon>
          <InputGroup.Input
            placeholder="Search your screenshots…"
            aria-label="Search screenshots"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <InputGroup.Button
              variant="ghost"
              shape="square"
              icon={X}
              onClick={clearSearch}
              aria-label="Clear search"
            />
          )}
        </InputGroup>
      </header>

      {searchError && (
        <Banner variant="error" className="gallery-banner">
          {searchError}
        </Banner>
      )}

      {error && (
        <Banner variant="error" className="gallery-banner">
          {error}
          <Button variant="secondary-destructive" size="sm" onClick={retryLoad}>
            Retry
          </Button>
        </Banner>
      )}

      {!loading && !error && screenshots.length === 0 && !isSearchActive && (
        <Empty
          size="lg"
          className="gallery-empty"
          icon={<Image size={48} weight="duotone" />}
          title="No screenshots yet"
          description="Use “Save to gallery” in the editor to keep screenshots here."
          contents={
            <LinkButton href="/" variant="primary">
              Open the editor
            </LinkButton>
          }
        />
      )}

      {isSearchActive && searchResults && resultCount === 0 && (
        <Empty
          size="lg"
          className="gallery-empty"
          icon={<MagnifyingGlass size={48} weight="duotone" />}
          title="No results found"
          description="Try a different search query."
        />
      )}

      {!loading && (isSearchActive ? resultCount > 0 : screenshots.length > 0) && (
        <div className="gallery-grid">
          {isSearchActive && searchResults
            ? searchResults.data.map((item) => (
                <GalleryCard
                  key={item.file_id}
                  src={imgUrl(item.key)}
                  alt="Search result screenshot"
                  caption={item.filename}
                  deleting={deletingKey === item.key}
                  onOpen={() => setLightboxKey(item.key)}
                  onDelete={() => handleDelete(item.key)}
                />
              ))
            : screenshots.map((shot) => (
                <GalleryCard
                  key={shot.key}
                  src={imgUrl(shot.key)}
                  alt={`Screenshot saved ${formatDate(shot.uploaded)}`}
                  caption={formatDate(shot.uploaded)}
                  detail={formatSize(shot.size)}
                  deleting={deletingKey === shot.key}
                  onOpen={() => setLightboxKey(shot.key)}
                  onDelete={() => handleDelete(shot.key)}
                />
              ))}
        </div>
      )}

      <Dialog.Root
        open={!!lightboxKey}
        onOpenChange={(open) => {
          if (!open) setLightboxKey(null);
        }}
      >
        <Dialog size="xl" className="gallery-lightbox">
          <Dialog.Title className="sr-only">Screenshot preview</Dialog.Title>
          <Dialog.Close
            render={
              <Button
                variant="secondary"
                size="sm"
                shape="square"
                icon={X}
                aria-label="Close preview"
                className="gallery-lightbox-close"
              />
            }
          />
          {lightboxKey && (
            <img
              src={imgUrl(lightboxKey)}
              alt="Full size screenshot"
              className="gallery-lightbox-img"
            />
          )}
          {lightboxShot && (
            <footer className="gallery-lightbox-footer">
              <Text size="sm" variant="secondary">
                {formatDate(lightboxShot.uploaded)}
              </Text>
              <Text variant="mono-secondary">{formatSize(lightboxShot.size)}</Text>
              <Button
                variant="destructive"
                size="sm"
                icon={Trash}
                loading={deletingKey === lightboxKey}
                onClick={() => handleDelete(lightboxKey!)}
                className="gallery-lightbox-delete"
              >
                Delete
              </Button>
            </footer>
          )}
        </Dialog>
      </Dialog.Root>
    </div>
  );
}

export default GalleryPage;
