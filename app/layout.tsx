import type { ReactNode } from "react";

export const metadata = {
  title: "GitHub Real Grass",
  description: "README-friendly GitHub contribution grass SVG"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
