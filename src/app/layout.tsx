import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { AgendaProvider } from "@/context/AgendaContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { RentabilityProvider } from "@/context/RentabilityContext";
import AuthGuard from "@/components/layout/AuthGuard";
import EventManagementModal from "@/components/agenda/EventManagementModal";

export const metadata: Metadata = {
  title: "Gestión BNC Móvil",
  description: "Sistema de gestión para jornadas bancarias de BNC",
};

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true} className={`${montserrat.variable}`}>
      <body className="antialiased font-sans bg-gray-50 relative">
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="watermark-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
                <g transform="scale(2.5) translate(10, 10)">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 18H9" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8v10" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="6.5" cy="18.5" r="2.5" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="16.5" cy="18.5" r="2.5" fill="none" stroke="#00205B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#watermark-pattern)" />
          </svg>
        </div>
        <ToastProvider>
          <AuthProvider>
            <AuthGuard>
              <AgendaProvider>
                <RentabilityProvider>
                  <div className="min-h-screen flex flex-col relative z-10">
                    <Header />
                    <main className="flex-1 w-full max-w-full p-0 flex flex-col min-h-0">
                      {children}
                    </main>
                    <footer className="mt-auto w-full py-3 px-4 text-center border-t border-slate-100 bg-white/50 backdrop-blur-sm print:hidden">
                      <span className="text-[11px] font-medium text-slate-400 tracking-wide select-none">
                        © 2026 Agenda Móvil - Todos los derechos reservados.
                      </span>
                    </footer>
                  </div>
                  <EventManagementModal />
                </RentabilityProvider>
              </AgendaProvider>
            </AuthGuard>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
