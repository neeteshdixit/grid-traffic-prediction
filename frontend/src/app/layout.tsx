import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TrafficAI | Traffic Demand Prediction Platform",
    template: "%s | TrafficAI",
  },
  description:
    "A premium, production-ready traffic demand prediction platform with dataset uploads, model training, batch scoring, SHAP explainability, and responsive analytics.",
  keywords: [
    "traffic prediction",
    "demand forecasting",
    "machine learning dashboard",
    "geohash",
    "FastAPI",
    "Next.js",
    "shap explainability",
  ],
  authors: [{ name: "TrafficAI Team" }],
  openGraph: {
    title: "TrafficAI | Traffic Demand Prediction Platform",
    description:
      "Upload datasets, train a champion model, inspect explainability, and generate submission-ready predictions.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%2306b6d4'/><text x='50' y='63' text-anchor='middle' font-family='Arial, sans-serif' font-size='44' font-weight='700' fill='white'>TA</text></svg>"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

