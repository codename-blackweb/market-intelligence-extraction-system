"use client";

export default function PrintButton() {
  return (
    <button className="ghost-button" onClick={() => window.print()} type="button">
      Print / Save PDF
    </button>
  );
}

