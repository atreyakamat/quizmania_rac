import React from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';

export interface ClubPhoto {
  id: string;
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  tag?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Default club media assets registry.
 * Extensible for future club activities, event photographs, and fellowship drives.
 */
export const CLUB_MEDIA_REGISTRY: ClubPhoto[] = [
  {
    id: 'rotaract-mapusa-group-fellowship',
    src: '/branding/grouppic.jpeg',
    alt: 'Rotaract Club of Mapusa members and leadership team fellowship',
    title: 'Rotaract Club of Mapusa Leadership & Members',
    caption: 'Committed youth leaders and fellowship members of Rotaract Club of Mapusa (RI District 3170) advancing service, education, and community initiatives in Goa.',
    tag: 'Club Fellowship',
    width: 1040,
    height: 780,
    priority: false
  }
];

interface ClubMediaProps {
  photos?: ClubPhoto[];
  featuredOnly?: boolean;
  className?: string;
}

export function ClubMedia({ photos = CLUB_MEDIA_REGISTRY, featuredOnly = true, className = '' }: ClubMediaProps) {
  if (photos.length === 0) return null;

  const displayPhotos = featuredOnly ? photos.slice(0, 1) : photos;

  return (
    <div className={`space-y-4 ${className}`}>
      {displayPhotos.map((photo) => (
        <figure
          key={photo.id}
          className="group relative overflow-hidden rounded-3xl bg-white border border-[#F0E1E8] shadow-md shadow-[#A50D52]/5 transition-all hover:shadow-lg hover:border-[#D83B70]/40"
        >
          {/* Tag Pill */}
          {photo.tag && (
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-[#6E123D] shadow-sm border border-[#F0E1E8]">
                <Users className="w-3.5 h-3.5 text-[#A50D52]" />
                <span>{photo.tag}</span>
              </span>
            </div>
          )}

          {/* Image Container */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF8F9]">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width || 1040}
              height={photo.height || 780}
              priority={photo.priority || false}
              loading={photo.priority ? undefined : 'lazy'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Caption */}
          {photo.caption && (
            <figcaption className="p-4 sm:p-5 bg-white border-t border-[#F0E1E8]/70">
              {photo.title && (
                <p className="text-sm font-bold text-[#24141C] mb-1">{photo.title}</p>
              )}
              <p className="text-xs text-[#6B5A62] leading-relaxed">{photo.caption}</p>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
