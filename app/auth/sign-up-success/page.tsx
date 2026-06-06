import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground">Account created successfully</p>
        </div>

        <div className="glass-card space-y-4">
          <p className="text-sm text-muted-foreground">
            Your StudentOS account has been created. Check your email to confirm your account, then you can sign in and start using the app.
          </p>
          
          <Link
            href="/auth/login"
            className="inline-block w-full glass-button bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:bg-primary/80"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
