"use client";

import { useState, type RefObject } from "react";

export default function ExportPdfButton({
  targetRef,
  fileName
}: {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    setIsExporting(true);

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;

      await html2pdf()
        .from(target)
        .set({
          margin: 10,
          filename: fileName,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .save();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button className="secondary-button" disabled={isExporting} onClick={handleExport} type="button">
      {isExporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
