// src/shared/ui/SiteFooter/SiteFooter.tsx
// Renders the shared site identity, copyright, and design credit.
import styles from "./SiteFooter.module.css";

type SiteFooterProps = {
  name: string;
  year: number;
};

export function SiteFooter({ name, year }: SiteFooterProps) {
  return (
    <footer className={styles.footer} lang="es">
      <div className={styles.content}>
        <p className={styles.name}>{name}</p>
        <p className={styles.copy}>
          © {year} <span className={styles.brand}>OnlyCode</span>. Todos los derechos reservados.
        </p>
        <p className={styles.credit}>
          Diseño por <a className={styles.brand} href="https://OnlyCode.app">OnlyCode</a>
        </p>
      </div>
    </footer>
  );
}
