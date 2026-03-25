"use client";

import { useState, type RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fffdfa",
        logging: false,
        windowWidth: target.scrollWidth
      });

      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
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

