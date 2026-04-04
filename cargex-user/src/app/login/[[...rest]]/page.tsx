import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0D0F14] text-white flex flex-col">
      {/* Header */}
      <nav className="px-6 py-5">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="text-white font-black">Cargex</span>
        </Link>
      </nav>

      {/* Sign In */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
