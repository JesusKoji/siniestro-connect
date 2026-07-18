import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { AseguradosApp } from "./apps/AseguradosApp";
import { AppHeader } from "@/components/AppHeader";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import { PolizasApp } from "./apps/PolizasApp";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ConBarra = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen gradient-surface text-foreground">
    <AppHeader />
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/asegurados/:id"
            element={
              <ConBarra>
                <AseguradosApp />
              </ConBarra>
            }
          />
          <Route
            path="/polizas/nueva/:idAsegurado"
            element={
              <ConBarra>
                <PolizasApp />
              </ConBarra>
            }
          />
          <Route
            path="/polizas/:id"
            element={
              <ConBarra>
                <PolizasApp />
              </ConBarra>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
