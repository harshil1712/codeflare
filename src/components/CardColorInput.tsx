import { useState } from "react";
import { InputGroup } from "@cloudflare/kumo";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface CardColorInputProps {
  id?: string;
  value: string;
  onChange: (hex: string) => void;
}

/** Hex text field with an inline native color swatch, built on Kumo's InputGroup. */
function CardColorInput({ id, value, onChange }: CardColorInputProps) {
  // Holds in-progress text while the user types; null means "show the committed value".
  const [draft, setDraft] = useState<string | null>(null);

  const handleText = (text: string) => {
    const next = text.startsWith("#") ? text : `#${text}`;
    setDraft(next);
    if (HEX_PATTERN.test(next)) onChange(next.toLowerCase());
  };

  return (
    <InputGroup size="sm" className="inspector-control">
      <InputGroup.Addon>
        <input
          type="color"
          className="color-swatch-input"
          value={value}
          onChange={(e) => {
            setDraft(null);
            onChange(e.target.value);
          }}
          aria-label="Pick card color"
        />
      </InputGroup.Addon>
      <InputGroup.Input
        id={id}
        className="mono-input"
        value={draft ?? value.toUpperCase()}
        onChange={(e) => handleText(e.target.value)}
        onBlur={() => setDraft(null)}
        maxLength={7}
        spellCheck={false}
        aria-label="Card color hex value"
        aria-invalid={draft !== null && !HEX_PATTERN.test(draft)}
      />
    </InputGroup>
  );
}

export default CardColorInput;
