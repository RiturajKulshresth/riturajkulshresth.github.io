import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import PhotoGallery from "@/components/photo-gallery";
import { photos } from "@/lib/photography";

export const metadata: Metadata = {
  title: "Photography",
  description:
    "A drag-to-pan gallery of photographs by Rituraj Kulshresth. Hosted on Unsplash.",
  openGraph: {
    title: "Photography · Rituraj Kulshresth",
    description: "A drag-to-pan gallery of photographs by Rituraj Kulshresth.",
  },
};

export default function PhotographyPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden">
        <PhotoGallery photos={photos} />
      </main>
    </>
  );
}
