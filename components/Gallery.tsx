"use client";
import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main"><Image src={images[i]} alt={name} fill priority sizes="(max-width:900px) 100vw, 50vw" /></div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src, n) => (
            <button key={src} className={n === i ? "thumb on" : "thumb"} onClick={() => setI(n)}><Image src={src} alt="" fill sizes="100px" /></button>
          ))}
        </div>
      )}
    </div>
  );
}
