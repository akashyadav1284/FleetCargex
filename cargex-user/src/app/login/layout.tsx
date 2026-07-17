import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your FleetCargex profile account to book cargo mini trucks, manage invoices, and track active dispatches.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
