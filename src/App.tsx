
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DataProfiling from "./pages/DataProfiling";
import DataVisualization from "./pages/DataVisualization";
import DataCleaning from "./pages/DataCleaning";
import DataBot from "./pages/DataBot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/data-profiling" element={<DataProfiling />} />
          <Route path="/data-visualization" element={<DataVisualization />} />
          <Route path="/data-cleaning" element={<DataCleaning />} />
          <Route path="/data-bot" element={<DataBot />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
