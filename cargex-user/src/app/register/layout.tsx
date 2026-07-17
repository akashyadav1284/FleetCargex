import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up & Register',
  description: 'Create a new FleetCargex profile account to instantly hire Verified logistics driver partners and track goods transports.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
