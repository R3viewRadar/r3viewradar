import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/authContext";
import HomePage from "@/pages/home";
import ResultsPage from "@/pages/results";
import NotFound from "@/pages/not-found";
import HowItWorksPage from "@/pages/how-it-works";
import AuthPage from "@/pages/auth";
import ProfilePage from "@/pages/profile";
import ComparePage from "@/pages/compare";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/compare" component={ComparePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router hook={useHashLocation}>
          <AppRoutes />
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
