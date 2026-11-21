import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        alarm: "#ff2d2d",
        surface: "#0a0a0c",
        panel: "#121216",
      },
    },
  },
  plugins: [],
} satisfies Config;