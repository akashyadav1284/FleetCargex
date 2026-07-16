import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FleetCargex - Book Cargo & Logistics',
  description: 'Book mini trucks and cargo vehicles instantly with live tracking and verified drivers.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#10B981',
          colorBackground: '#0D0F14',
          colorInputBackground: '#1A1D27',
          colorInputText: '#F9FAFB',
          borderRadius: '0.75rem',
          fontSize: '14px',
        },
        elements: {
          rootBox: 'w-full',
          card: 'bg-[#13151C] border border-[#2D3039] shadow-2xl rounded-2xl',
          headerTitle: 'text-white font-bold text-2xl',
          headerSubtitle: 'text-[#9CA3AF]',
          socialButtonsBlockButton: 'bg-[#1A1D27] border-[#2D3039] text-white hover:bg-[#22252F] rounded-xl py-3',
          socialButtonsBlockButtonText: 'font-semibold',
          formButtonPrimary: 'bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl py-3 text-sm shadow-lg',
          formFieldInput: 'bg-[#1A1D27] border-[#2D3039] text-white rounded-xl py-3 focus:border-[#10B981] focus:ring-[#10B981]',
          formFieldLabel: 'text-[#9CA3AF] font-medium text-xs uppercase tracking-wider',
          footerActionLink: 'text-[#10B981] font-bold hover:text-[#34D399]',
          identityPreview: 'bg-[#1A1D27] border-[#2D3039]',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-[#10B981]',
          dividerLine: 'bg-[#2D3039]',
          dividerText: 'text-[#9CA3AF]',
          formFieldAction: 'text-[#10B981]',
          footerAction: 'text-[#9CA3AF]',
          alertText: 'text-red-400',
          badge: 'bg-[#10B981]/20 text-[#10B981]',
          userButtonPopoverCard: 'bg-[#13151C] border-[#2D3039]',
          userButtonPopoverActionButton: 'text-white hover:bg-[#1A1D27]',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverFooter: 'border-[#2D3039]',
        }
      }}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
