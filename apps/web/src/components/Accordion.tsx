/**
 * Shared content accordion with a per-group progress counter (DSM-020).
 * No literal Accordion primitive existed before this — .ax-nav-group was
 * navigation-only. Built from the same proven chevron/RTL rotation pattern,
 * new CSS classes (.ax-accordion*) using existing tokens only.
 */
"use client";
import { useState } from "react";
import { IconChevronDown } from "@/app/icons";

type AccordionItem = {
  id: string;
  title: string;
  progress?: string;
  defaultOpen?: boolean;
  content: React.ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
};

export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<Set<string>>(new Set(items.filter(i => i.defaultOpen).map(i => i.id)));
  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  return (
    <div className="ax-accordion">
      {items.map(item => {
        const expanded = open.has(item.id);
        return (
          <div key={item.id} className="ax-accordion__item">
            <button
              type="button"
              className="ax-accordion__trigger"
              aria-expanded={expanded}
              aria-controls={`ax-accordion-body-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              <span>{item.title}</span>
              <span className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
                {item.progress ? <span className="ax-accordion__progress numeric">{item.progress}</span> : null}
                <IconChevronDown size={16} className="ax-accordion__chevron" />
              </span>
            </button>
            {expanded && (
              <div id={`ax-accordion-body-${item.id}`} className="ax-accordion__body">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
