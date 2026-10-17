"use client";

import { useEffect } from "react";

/**
 * On phones, `.table-cards` tables render each row as a card whose cells show
 * their column title (CSS `td::before { content: attr(data-label) }`). This
 * copies each header's text onto the matching cells as `data-label`, and keeps
 * doing so as pages re-render.
 */
function label(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>("table.table-cards").forEach((table) => {
    const heads = [...table.querySelectorAll<HTMLElement>("thead th")].map(
      (th) => th.textContent?.trim() ?? "",
    );
    table.querySelectorAll<HTMLTableRowElement>("tbody tr, tfoot tr").forEach((tr) => {
      let col = 0;
      for (const cell of tr.cells) {
        // Button cells (row actions) get no title; they sit on their own line.
        const isActions = !!cell.querySelector("button, a.btn");
        const text = isActions ? "" : (heads[col] ?? "");
        if (isActions) cell.dataset.actions = "1";
        else if (text && cell.dataset.label !== text) cell.dataset.label = text;
        col += cell.colSpan || 1;
      }
    });
  });
}

export function ResponsiveTables() {
  useEffect(() => {
    label(document);
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => label(document));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return null;
}
