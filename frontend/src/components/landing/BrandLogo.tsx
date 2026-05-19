import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type BrandLogoProps = {
	href?: string;
	variant?: "gradient" | "light" | "dark";
	size?: "sm" | "md";
};

const logoSizes = {
	sm: 40,
	md: 56,
};

export function BrandLogo({ href = "/", variant = "gradient", size = "md" }: BrandLogoProps) {
	const dimension = logoSizes[size];
	const imageClassName = clsx(
		"block rounded-2xl object-cover shadow-[0_10px_24px_rgba(15,23,42,0.14)]",
		variant === "light" && "ring-1 ring-white/20",
		variant === "dark" && "ring-1 ring-slate-900/10",
	);

	const content = (
		<span className="inline-flex items-center">
			<Image src="/logo.png" alt="SabaHub" width={dimension} height={dimension} className={imageClassName} style={{ width: dimension, height: dimension }} priority={size === "sm"} />
		</span>
	);

	return (
		<Link href={href} className="inline-flex items-center" aria-label="SabaHub home">
			{content}
		</Link>
	);
}
