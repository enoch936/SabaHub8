import { memo } from 'react'; interface LoadingSkeletonProps { rows?: number; className?: string;
} const LoadingSkeleton = memo(function LoadingSkeleton({ rows = 3, className = '' }: LoadingSkeletonProps) { return ( <div className={`space-y-3 ${className}`}> {Array.from({ length: rows }).map((_, i) => ( <div key={i} className="animate-pulse space-y-2"> <div className="h-4 bg-[var(--accent)] rounded w-3/4" /> <div className="h-3 bg-[var(--accent)] rounded w-1/2" /> </div> ))} </div> );
}); export default LoadingSkeleton;
