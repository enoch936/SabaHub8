interface ErrorStateProps { title?: string; description?: string; onRetry?: () => void;
} export default function ErrorState({ title = 'Something went wrong', description = 'An unexpected error occurred. Please try again.', onRetry,
}: ErrorStateProps) { return ( <div className="flex flex-col items-center justify-center py-16 px-4 text-center"> <div className="text-5xl mb-4">⚠️</div> <h3 className="text-lg font-semibold mb-2">{title}</h3> <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p> {onRetry && ( <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity" > Try Again </button> )} </div> );
}
