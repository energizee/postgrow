import { ImageOff } from "lucide-react";
import "./ProofImage.css";

const ICON_SIZE = 28;

type ProofImageProps = {
  src: string;
  alt: string;
  className?: string;
};

// The proof photo, or a plain placeholder when there isn't one
export function ProofImage({ src, alt, className = "" }: ProofImageProps) {
  if (src) return <img className={`proof-image ${className}`} src={src} alt={alt} />;
  return (
    <span className={`proof-image proof-image--empty ${className}`} role="img" aria-label="No photo">
      <ImageOff size={ICON_SIZE} aria-hidden="true" />
    </span>
  );
}
