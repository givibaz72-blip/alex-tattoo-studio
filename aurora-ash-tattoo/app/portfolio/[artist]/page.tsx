import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: { artist: string };
}

const artistImages: Record<string, string> = {
  alex: '/portfolio/alex.png',
  aurora: '/portfolio/aurora.png',
  julian: '/portfolio/julian.png',
};

export default function ArtistPage({ params }: Props) {
  const { artist } = params;
  const imageSrc = artistImages[artist];
  if (!imageSrc) {
    notFound();
    return null;
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 capitalize">{artist}'s Gallery</h1>
      <Image src={imageSrc} alt={`${artist} artwork`} width={800} height={600} className="rounded" />
    </div>
  );
}
