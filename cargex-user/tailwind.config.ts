import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F5F5F5",
        surfaceHighlight: "#F9FAFB",
        inputBg: "#F3F4F6",
        accent: "#16A34A",
        muted: "#6B7280",
        border: "#E5E7EB",
        foreground: "#111111",
        primary: "#000000",
      },
    },
  },
  plugins: [],
};
export default config;
