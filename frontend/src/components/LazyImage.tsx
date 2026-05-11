import Image, { type ImageProps } from "next/image";

type LazyImageProps = Omit<ImageProps, "loading"> & {
  /** Optional blur data URL for placeholder. Falls back to a generic blur. */
  blurDataURL?: string;
};

/**
 * LazyImage — thin wrapper around Next.js Image with lazy loading and blur placeholder.
 * Automatically sets loading="lazy" and placeholder="blur".
 */
export default function LazyImage({
  alt = "",
  blurDataURL,
  placeholder,
  ...props
}: LazyImageProps) {
  // Default 1×1 transparent blur placeholder if none provided
  const defaultBlur =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  return (
    <Image
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL={blurDataURL ?? defaultBlur}
      {...props}
    />
  );
}
