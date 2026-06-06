import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
          <p className="text-muted-foreground">Something went wrong</p>
        </div>

        <div className="glass-card space-y-4">
          {params?.error ? (
            <p className="text-sm text-muted-foreground">
              Error code: {params.error}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
          )}
          
          <Link
            href="/auth/login"
            className="inline-block w-full glass-button bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:bg-primary/80"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
