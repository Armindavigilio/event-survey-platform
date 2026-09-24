// src/modules/gallery/presentation/GalleryLightbox.tsx
// Encapsulates the third-party image viewer and zoom controls.
"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import type { GalleryImage } from "../gallery.config";

type GalleryLightboxProps = {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
};

export default function GalleryLightbox({ images, index, onClose }: GalleryLightboxProps) {
  return (
    <Lightbox
      open
      styles={{ root: { fontFamily: "var(--font-content)" } }}
      close={onClose}
      index={index}
      slides={images}
      plugins={[Zoom]}
      carousel={{ finite: true, preload: 1 }}
      controller={{ aria: true }}
      animation={{ fade: 0, swipe: 0, zoom: 0 }}
      labels={{
        Close: "Cerrar",
        Next: "Siguiente imagen",
        Previous: "Imagen anterior",
        "Zoom in": "Ampliar",
        "Zoom out": "Reducir",
      }}
      render={images.length < 2 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
    />
  );
}
