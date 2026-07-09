import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export default function BrandLogo({
  compact = false,
  priority = false,
  className = "",
  imageClassName = "",
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={compact ? "/brand/invonix-mark.png" : "/brand/invonix-logo.png"}
        alt="Invonix"
        width={compact ? 150 : 440}
        height={150}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        className={`block object-contain ${imageClassName}`}
      />
    </span>
  );
}
