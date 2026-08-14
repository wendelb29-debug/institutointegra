import { useSignedUrl } from '@/lib/storage';

interface RoomImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/** Renders a room photo stored in the private `contract-assets` bucket via a signed URL. */
export const RoomImage = ({ src, alt, className, loading }: RoomImageProps) => {
  const resolved = useSignedUrl('contract-assets', src);
  if (!resolved) return null;
  return <img src={resolved} alt={alt} className={className} loading={loading} />;
};

export default RoomImage;
