import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 w-full h-full overflow-hidden">
            <div className="w-full h-full overflow-auto">
              <div className="flex-1 h-screen w-screen mx-auto pr-10">
                <Outlet />
              </div>
            </div>
          </main>
        </SidebarProvider>
      </div>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
