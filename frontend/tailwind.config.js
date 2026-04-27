/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6E56",
          dark: "#0a4f3c",
          light: "#1D9E75",
          foreground: "#ffffff",
        },
        background: "#F1EFE8",
        foreground: "#1A1A1A",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#0F6E56",
        foreground: "#1A1A1A",
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#1A1A1A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1A1A1A",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1A1A1A",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
}