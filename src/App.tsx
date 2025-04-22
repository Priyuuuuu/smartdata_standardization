import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DataProfiling from "./pages/DataProfiling";
import DataVisualization from "./pages/DataVisualization";
import DataCleaning from "./pages/DataCleaning";
import DataBot from "./pages/DataBot";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import { AuthProvider, useAuth } from "./hooks/AuthContext";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const auth = useAuth();
  return auth.user ? children : <Navigate to="/signin" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/data-profiling"
              element={
                <PrivateRoute>
                  <DataProfiling />
                </PrivateRoute>
              }
            />
            <Route
              path="/data-visualization"
              element={
                <PrivateRoute>
                  <DataVisualization />
                </PrivateRoute>
              }
            />
            <Route
              path="/data-cleaning"
              element={
                <PrivateRoute>
                  <DataCleaning />
                </PrivateRoute>
              }
            />
            <Route
              path="/data-bot"
              element={
                <PrivateRoute>
                  <DataBot />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
