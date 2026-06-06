import type { Metadata } from "next";
import BackButton from "./_photography/components/back-button";
import PhotoGallery from "./_photography/components/photo-gallery";
import { photos } from "./_photography/data";

export const metadata: Metadata = {
  title: "Photography",
  description:
    "A drag-to-pan gallery of photographs by Rituraj Kulshresth. Hosted on Unsplash.",
  openGraph: {
    title: "Rituraj Kulshresth · Photography",
    description: "A drag-to-pan gallery of photographs by Rituraj Kulshresth.",
  },
};

export default function PhotographyPage() {
  return (
    <>
      <BackButton />
      <main id="main" className="overflow-hidden">
        <PhotoGallery photos={photos} />
      </main>
    </>
  );
}
