import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { CosmeticsProvider } from "./components/CosmeticsContext";
import { AppProvider } from "./context/AppContext";
import { GlobalLayout } from "./components/GlobalLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { UIModeRouter } from "./components/UIModeRouter";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import { RegisterServiceWorker } from "./components/RegisterServiceWorker";
import { LanguageProvider } from "./context/LanguageContext";
import { viewport } from "./viewport";
import "./lib/fontawesome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pixel Operator Mono - fonte pixel art
// Baixe a fonte em: https://fontlibrary.org/en/font/pixel-operator
// E coloque os arquivos .ttf em app/fonts/
// Descomente o código abaixo após adicionar os arquivos:
/*
const pixelOperatorMono = localFont({
  src: [
    {
      path: "./fonts/PixelOperatorMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/PixelOperatorMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pixel-operator-mono",
  fallback: ["monospace", "Courier New"],
});
*/

// Fallback temporário até os arquivos serem adicionados
const pixelOperatorMono = {
  variable: "--font-pixel-operator-mono",
} as { variable: string };

export const metadata: Metadata = {
  title: "Pixel Life - Life Management App",
  description: "Aplicação de gerenciamento de vida com estética pixel-art. Gerencie hábitos, diário, finanças e muito mais!",
  keywords: ["life management", "habits", "journal", "finance", "pixel art"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pixel Life",
  },
  icons: {
    icon: [
      { url: "/Icon3.png", sizes: "any" },
      { url: "/Icon3.png", sizes: "192x192", type: "image/png" },
      { url: "/Icon3.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/Icon3.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [
      { url: "/Icon3.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
};

// Exportar viewport separadamente (Next.js 16)
export { viewport };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} ${pixelOperatorMono.variable} antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            <LanguageProvider>
              <ConfirmationProvider>
                <AuthProvider>
                  <UIProvider>
                    <UIModeRouter />
                    <AppProvider>
                      <CosmeticsProvider>
                        <GlobalLayout>
                          {children}
                        </GlobalLayout>
                        <RegisterServiceWorker />
                      </CosmeticsProvider>
                    </AppProvider>
                  </UIProvider>
                </AuthProvider>
              </ConfirmationProvider>
            </LanguageProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
