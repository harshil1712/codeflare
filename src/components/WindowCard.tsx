import type { ReactNode } from "react";

interface WindowCardProps {
  title: string;
  children: ReactNode;
  background?: string;
}

function WindowCard({ title, children, background }: WindowCardProps) {
  return (
    <div className="window-card" style={background ? { background } : undefined}>
      <div className="window-title-bar">
        <div className="window-dots">
          <div className="window-dot window-dot-red"></div>
          <div className="window-dot window-dot-yellow"></div>
          <div className="window-dot window-dot-green"></div>
        </div>
        <div className="window-title">{title}</div>
      </div>
      <div className="window-content">{children}</div>
    </div>
  );
}

export default WindowCard;
