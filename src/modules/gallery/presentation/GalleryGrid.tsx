// src/modules/gallery/presentation/GalleryGrid.tsx
// Displays image previews and opens the selected image for inspection.
"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { GalleryImage } from "../gallery.config";
import styles from "./GalleryGrid.module.css";

const GalleryLightbox = dynamic(() => import("./GalleryLightbox"));

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(-1);

  return (
    <>
      <ul className={styles.grid}>
        {images.map((image, position) => (
          <li key={image.id}>
            <button
              type="button"
              className={styles.preview}
              onClick={() => setIndex(position)}
              aria-label={`Ampliar: ${image.alt}`}
              aria-haspopup="dialog"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 640px) 100vw, 480px"
                className={styles.image}
              />
              <span className={styles.hint}>Ampliar imagen</span>
            </button>
          </li>
        ))}
      </ul>
      {index >= 0 && (
        <GalleryLightbox images={images} index={index} onClose={() => setIndex(-1)} />
      )}
    </>
  );
}
