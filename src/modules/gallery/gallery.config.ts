// src/modules/gallery/gallery.config.ts
// Defines the local event images independently of the lightbox library.
export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const galleryImages: GalleryImage[] = [
  {
    id: "cartel-evento",
    src: "/images/gallery/Cartel_evento.webp",
    alt: "Cartel del evento Deja tu huella. Arte urbano para transformar tu entorno",
    width: 3620,
    height: 4526,
  },
];
