import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // This is now JobRewrite
import NotFound from "./pages/NotFound";
import ResumeAnalyzer from "./pages/ResumeAnalyzer"; // This is now the home page
// import LoginPage from "./pages/LoginPage"; // Commented out
// import SignupPage from "./pages/SignupPage"; // Commented out
// import VerifyEmailPage from "./pages/VerifyEmailPage"; // Commented out
// import ProtectedRoute from "./components/ProtectedRoute"; // Commented out
import { AuthProvider } from "./hooks/use-auth";
// import DashboardPage from "./pages/DashboardPage"; // Commented out
import AppHeader from "./components/AppHeader";
import UnderConstructionBanner from "./components/UnderConstructionBanner";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="flex flex-col min-h-screen">
        <BrowserRouter>
          <AuthProvider>
            <AppHeader /> {/* AppHeader is always visible */}
            <UnderConstructionBanner /> {/* New banner */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<ResumeAnalyzer />} /> {/* New Home Page */}
              <Route path="/job-rewrite" element={<Index />} /> {/* Old Home Page, now at /job-rewrite */}
              {/*
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              */}
              
              {/* Protected Routes */}
              {/*
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              */}

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;