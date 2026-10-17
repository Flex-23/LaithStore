"use client";

/**
 * Opens the browser's print dialog ("Save as PDF"). The document title becomes
 * the suggested file name, then is restored.
 */
export function PrintButton({ fileName, label = "حفظ كملف PDF" }: { fileName: string; label?: string }) {
  function save() {
    const previous = document.title;
    document.title = fileName;
    window.print();
    // Print is synchronous in most browsers; restore right after.
    setTimeout(() => {
      document.title = previous;
    }, 500);
  }
  return (
    <button type="button" onClick={save} className="btn btn-primary">
      {label}
    </button>
  );
}
