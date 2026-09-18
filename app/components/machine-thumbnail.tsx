import { Wrench } from "lucide-react";
import Image from "next/image";
import type { MachinePhotoView } from "@/lib/data/types";

export function MachineThumbnail({ photos }: { photos: MachinePhotoView[] }) {
  const cover = photos.find((photo) => photo.url);

  return (
    <span className={`machine-thumb${cover?.url ? " has-photo" : ""}`} aria-hidden="true">
      {cover?.url ? <Image src={cover.url} alt="" width={56} height={48} loading="lazy" unoptimized /> : <Wrench size={18} />}
    </span>
  );
}
