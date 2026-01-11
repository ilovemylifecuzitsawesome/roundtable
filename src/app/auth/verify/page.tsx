export default function VerifyPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-approve/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-approve"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-civic-900 mb-2">
            Check your email
          </h1>
          <p className="text-civic-600">
            We sent you a magic link to sign in. Click the link in your email to
            continue.
          </p>
          <p className="text-sm text-civic-500 mt-4">
            Didn&apos;t receive it? Check your spam folder or try again.
          </p>
        </div>
      </div>
    </div>
  );
}
