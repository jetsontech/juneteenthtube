import Image from "next/image";
import type { ImageProps } from "next/image";

export default function OptimizedImage(props: ImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt ?? ""}
      unoptimized
      sizes={props.fill ? "100vw" : undefined}
      loading={props.priority ? "eager" : "lazy"}
      style={{
        objectFit: props.style?.objectFit || "cover",
        ...props.style
      }}
    />
  );
}