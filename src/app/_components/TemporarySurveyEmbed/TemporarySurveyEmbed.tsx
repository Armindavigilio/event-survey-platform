// src/app/_components/TemporarySurveyEmbed/TemporarySurveyEmbed.tsx
// Embeds the temporary Google Forms survey in the public delivery layer.
// This integration bypasses, and does not modify, the original survey module.
import styles from "./TemporarySurveyEmbed.module.css";

const formUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLScY2MPoty1er5H__Ui40uHkvV3Kolv0L9QfIOunuQ5w1XwfAw/viewform";

export function TemporarySurveyEmbed() {
  return (
    <section className={styles.section} aria-labelledby="survey-title">
      <h2 id="survey-title" className={styles.title}>Comparte tu opinión</h2>
      <p className={styles.help}>
        Si el formulario no se muestra correctamente, puedes{" "}
        <a href={formUrl} target="_blank" rel="noopener noreferrer">
          abrir la encuesta en otra pestaña
        </a>.
      </p>
      <iframe
        className={styles.frame}
        src={`${formUrl}?embedded=true`}
        title="Encuesta Deja tu huella: arte urbano para transformar tu entorno"
        width="640"
        height="3271"
        loading="lazy"
      />
    </section>
  );
}
