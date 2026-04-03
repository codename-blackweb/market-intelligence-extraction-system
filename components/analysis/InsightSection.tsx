import type { ReactNode } from "react";
import styles from "./analysis-ui.module.css";

export default function InsightSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </section>
  );
}
