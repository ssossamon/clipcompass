import "./globals.css";

export const metadata = {
  title: "ClipCompass — Free YouTube SEO Audit",
  description:
    "Get an instant, data-backed SEO audit for any YouTube video. See exactly what's holding your rankings back, straight from YouTube's own API."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
