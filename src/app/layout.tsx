import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import SmoothCursor from "@/components/animations/SmoothCursor";
import SmoothScroll from "@/components/animations/SmoothScroll";
import WebGLBackground from "@/components/animations/WebGLBackgroundLazy";
import Preloader from "@/components/animations/Preloader";
import RouteTransition from "@/components/animations/RouteTransition";

const font = DM_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-darkmode`}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="system"
        >
          {/* Fixed chrome — must live OUTSIDE #smooth-wrapper */}
          <WebGLBackground />
          <Preloader />
          <RouteTransition />
          <Header />
          <SmoothCursor />
          <ScrollToTop />

          <SmoothScroll>
            {children}
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
