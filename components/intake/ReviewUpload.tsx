"use client";

import { useState } from "react";
import { parseReviewsFile } from "@/lib/review-parser";
import { getErrorMessage } from "@/lib/utils";
import type { ReviewInput } from "@/types/intake";

export default function ReviewUpload({
  reviews,
  onChange
}: {
  reviews: ReviewInput[];
  onChange: (reviews: ReviewInput[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    try {
      const text = await file.text();
      const parsed = parseReviewsFile(file.name, text);
      onChange(parsed);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="stack">
      <div className="field">
        <label htmlFor="review-upload">Optional review upload</label>
        <input
          id="review-upload"
          className="text-input"
          type="file"
          accept=".json,.csv"
          onChange={handleFileChange}
        />
        <span className="field-hint">
          Upload `.json` or `.csv` with `source`, `rating`, `title`, and `body`.
        </span>
      </div>

      <div className="upload-meta">
        <span className="meta-tag">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} loaded
        </span>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
    </section>
  );
}

