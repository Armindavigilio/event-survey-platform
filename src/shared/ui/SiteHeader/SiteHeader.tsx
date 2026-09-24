// src/shared/ui/SiteHeader/SiteHeader.tsx
// Displays the site name as the shared page header.
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  name: string;
};

export function SiteHeader({ name }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.name}>{name}</p>
    </header>
  );
}
