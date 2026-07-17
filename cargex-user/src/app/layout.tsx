import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://fleetcargex.vercel.app"),
  title: {
    default: "FleetCargex - Book Cargo & Logistics",
    template: "%s | FleetCargex"
  },
  description: "Book mini trucks and cargo vehicles instantly with live tracking and verified drivers. FleetCargex connects shippers with third-party logistics partners and vehicle drivers.",
  applicationName: "FleetCargex",
  authors: [{ name: "FleetCargex Team" }],
  keywords: ["logistics", "cargo booking", "mini trucks", "transport services", "fleet booking", "live tracking", "on-demand logistics", "freight forwarding"],
  creator: "FleetCargex Technologies",
  publisher: "FleetCargex Technologies",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://fleetcargex.vercel.app",
    title: "FleetCargex - Book Cargo & Logistics",
    description: "Book mini trucks and cargo vehicles instantly with live tracking and verified drivers. FleetCargex connects shippers with third-party logistics partners.",
    siteName: "FleetCargex",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FleetCargex Logistics and Cargo Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetCargex - Book Cargo & Logistics",
    description: "Book mini trucks and cargo vehicles instantly with live tracking and verified drivers.",
    images: ["/og-image.png"],
    creator: "@fleetcargex",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://fleetcargex.vercel.app/#organization",
        "name": "FleetCargex",
        "url": "https://fleetcargex.vercel.app",
        "logo": "https://fleetcargex.vercel.app/icon.png",
        "sameAs": [
          "https://x.com/fleetcargex",
          "https://www.linkedin.com/company/fleetcargex"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://fleetcargex.vercel.app/#website",
        "url": "https://fleetcargex.vercel.app",
        "name": "FleetCargex",
        "publisher": {
          "@id": "https://fleetcargex.vercel.app/#organization"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://fleetcargex.vercel.app/#webpage",
        "url": "https://fleetcargex.vercel.app",
        "name": "FleetCargex - Book Cargo & Logistics",
        "isPartOf": {
          "@id": "https://fleetcargex.vercel.app/#website"
        },
        "about": {
          "@id": "https://fleetcargex.vercel.app/#organization"
        },
        "description": "Book mini trucks and cargo vehicles instantly with live tracking and verified drivers."
      }
    ]
  };

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
        <body className={inter.className}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* Google Analytics Tag */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-C5SCDVXX66"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-C5SCDVXX66');
            `}
          </Script>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
