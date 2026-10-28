import { Button, Text } from "@cloudflare/kumo";
import { ArrowsOut, Trash } from "@phosphor-icons/react";

interface GalleryCardProps {
  src: string;
  alt: string;
  /** Left-aligned caption (e.g. upload date). */
  caption?: string;
  /** Right-aligned secondary detail (e.g. file size). */
  detail?: string;
  deleting?: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function GalleryCard({ src, alt, caption, detail, deleting, onOpen, onDelete }: GalleryCardProps) {
  return (
    <article className="gallery-card">
      <button
        type="button"
        className="gallery-card-thumb"
        onClick={onOpen}
        aria-label="View full size"
      >
        <img src={src} alt={alt} className="gallery-card-img" loading="lazy" />
        <span className="gallery-card-overlay" aria-hidden="true">
          <ArrowsOut size={20} weight="bold" />
        </span>
      </button>
      <div className="gallery-card-info">
        <Text size="xs" variant="secondary" truncate>
          {caption}
        </Text>
        {detail && <Text variant="mono-secondary">{detail}</Text>}
        <Button
          variant="ghost"
          size="xs"
          shape="square"
          icon={Trash}
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete screenshot"
          className="gallery-card-delete"
        />
      </div>
    </article>
  );
}

export default GalleryCard;
