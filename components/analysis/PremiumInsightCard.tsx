import { LockKeyhole } from "lucide-react";
import styles from "./analysis-ui.module.css";

export default function PremiumInsightCard({
  title,
  preview,
  description
}: {
  title: string;
  preview: string[];
  description: string;
}) {
  return (
    <section className={styles.premiumCard}>
      <p className={styles.eyebrow}>Premium</p>
      <div className={styles.premiumPreview}>
        <ul className={styles.previewList}>
          {preview.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.premiumOverlay}>
        <div className={styles.premiumOverlayInner}>
          <LockKeyhole size={18} />
          <h3 className={styles.premiumTitle}>{title}</h3>
          <p className={styles.premiumCopy}>{description}</p>
        </div>
      </div>
    </section>
  );
}
