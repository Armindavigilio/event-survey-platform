// src/app/page.tsx
// Composes the event title, gallery, and temporary external survey.
import { GalleryGrid, galleryImages } from "@/modules/gallery";
import styles from "./page.module.css";
import { TemporarySurveyEmbed } from "./_components/TemporarySurveyEmbed/TemporarySurveyEmbed";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className={styles.title}>DEJA TU HUELLA</h1>
        <p className={styles.tagline}>
          ARTE URBANO PARA TRANSFORMAR TU ENTORNO
        </p>
      </header>

      <section aria-labelledby="gallery-title">
        <h2 id="gallery-title" className={styles.subtitle}>
          Galería de imágenes
        </h2>
        <GalleryGrid images={galleryImages} />
      </section>
      <TemporarySurveyEmbed />
    </main>
  );
}
