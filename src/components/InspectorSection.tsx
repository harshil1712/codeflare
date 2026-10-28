import type { ReactNode } from "react";

interface InspectorSectionProps {
  title: string;
  /** Optional control rendered on the right of the section heading (e.g. a ghost button). */
  action?: ReactNode;
  children: ReactNode;
}

function InspectorSection({ title, action, children }: InspectorSectionProps) {
  return (
    <section className="inspector-section" aria-label={title}>
      <header className="inspector-section-header">
        <h2 className="inspector-section-title">{title}</h2>
        {action}
      </header>
      <div className="inspector-section-body">{children}</div>
    </section>
  );
}

export default InspectorSection;
