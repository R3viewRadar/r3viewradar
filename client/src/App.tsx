import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home";
import ResultsPage from "@/pages/results";
import NotFound from "@/pages/not-found";
import HowItWorksPage from "@/pages/how-it-works";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
