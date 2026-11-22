import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        urgent: "#b45309",
        surface: "#f6f5f3",
        panel: "#ffffff",
        line: "#e4e2de",
        ink: "#1a1917",
        muted: "#6b6560",
      },
    },
  },
  plugins: [],
} satisfies Config;