import { Label } from "@cloudflare/kumo";
import type { ReactNode } from "react";

interface InspectorRowProps {
  label: string;
  /** Id of the control the label describes, when the control exposes one. */
  htmlFor?: string;
  children: ReactNode;
}

/** Label-left / control-right row used throughout the editor inspector. */
function InspectorRow({ label, htmlFor, children }: InspectorRowProps) {
  return (
    <div className="inspector-row">
      <Label htmlFor={htmlFor} className="inspector-row-label">
        {label}
      </Label>
      <div className="inspector-row-control">{children}</div>
    </div>
  );
}

export default InspectorRow;
