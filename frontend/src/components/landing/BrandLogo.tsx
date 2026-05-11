import Link from "next/link";
import clsx from "clsx";
import styles from "./LandingPage.module.css"; type BrandLogoProps = { href?: string; variant?: "gradient" | "light" | "dark"; size?: "sm" | "md";
}; export function BrandLogo({ href = "/", variant = "gradient", size = "md",
}: BrandLogoProps) { const textClass = variant === "light" ? "text-white" : variant === "dark" ? "text-slate-900" : styles.brandText; const content = ( <span className="inline-flex items-center gap-3"> <span className={styles.brandIcon} aria-hidden="true"> <span className={clsx(styles.brandDot, styles.brandDotLarge)} /> <span className={clsx(styles.brandDot, styles.brandDotRight)} /> <span className={clsx(styles.brandDot, styles.brandDotLowerLeft)} /> <span className={clsx(styles.brandDot, styles.brandDotLowerRight)} /> </span> <span className={clsx( "font-bold tracking-tight", size === "sm" ? "text-xl" : "text-2xl", textClass, )} > SabaHub </span> </span> ); return ( <Link href={href} className="inline-flex items-center" aria-label="SabaHub home"> {content} </Link> );
}
