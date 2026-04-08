import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Search, BarChart3, Shield, Zap,
  Globe, CheckCircle, XCircle, Clock, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiStatusEntry {
  configured: boolean;
  label: string;
}

interface ApiStatus {
  google: ApiStatusEntry;
  yelp: ApiStatusEntry;
  reddit: ApiStatusEntry;
  serpapi: ApiStatusEntry;
}

const STEPS = [
  {
    icon: Search,
    title: "Search anything",
    description: "Enter a business name, product, or brand. Choose whether you're looking for a local business or a product.",
  },
  {
    icon: Globe,
    title: "We scan every platform",
    description: "R3viewRadar queries Google, Yelp, Amazon, Reddit, TripAdvisor, Trustpilot, and more — all in parallel, in under 12 seconds.",
  },
  {
    icon: BarChart3,
    title: "Aggregated insights",
    description: "Reviews are scored, sentiment-analyzed, and ranked. See an overall rating, per-platform breakdowns, and individual reviews in one dashboard.",
  },
  {
    icon: Shield,
    title: "Filter the noise",
    description: "Sort by newest, highest, or lowest rated. Filter by star rating. Drill into specific platforms. Find the signal in the noise.",
  },
];

const PLATFORMS = [
  { name: "Google", icon: "google", desc: "Business reviews via Google Places API", type: "business" },
  { name: "Yelp", icon: "yelp", desc: "Ratings & reviews via Yelp Fusion API", type: "business" },
  { name: "Reddit", icon: "reddit", desc: "Community discussions & opinions via Reddit API", type: "both" },
  { name: "Amazon", icon: "amazon", desc: "Product reviews via shopping search", type: "product" },
  { name: "TripAdvisor", icon: "tripadvisor", desc: "Travel & hospitality reviews", type: "business" },
  { name: "Trustpilot", icon: "trustpilot", desc: "Consumer trust reviews", type: "product" },
  { name: "Best Buy", icon: "bestbuy", desc: "Electronics & tech reviews", type: "product" },
];

export default function HowItWorksPage() {
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/">
            <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Logo size={32} />
              <span className="text-lg font-bold tracking-tight text-foreground">R3view<span className="text-primary">Radar</span></span>
            </button>
          </Link>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground text-sm gap-1.5">
            <ArrowLeft size={14} />
            Back to search
          </Button>
        </Link>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            How R3viewRadar works
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            One search. Every review platform. Aggregated insights in seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-20">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="bg-card border border-border rounded-xl p-6 relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <step.icon size={20} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Platform coverage */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Platform coverage</h2>
            <p className="text-muted-foreground text-sm">
              We aggregate reviews from these major platforms
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
              >
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <PlatformIcon platform={p.icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {p.type === "both" ? "All" : p.type === "business" ? "Business" : "Product"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Status */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Live API status</h2>
            <p className="text-muted-foreground text-sm">
              Real-time connection status for each data source
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Google Places", key: "google" as keyof ApiStatus, icon: "google" },
                { name: "Yelp Fusion", key: "yelp" as keyof ApiStatus, icon: "yelp" },
                { name: "Reddit", key: "reddit" as keyof ApiStatus, icon: "reddit" },
                { name: "SerpAPI", key: "serpapi" as keyof ApiStatus, icon: "google" },
              ].map((api) => {
                const isLive = apiStatus?.[api.key]?.configured ?? false;
                return (
                  <div key={api.key} className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      isLive ? "bg-green-500" : "bg-muted-foreground/40"
                    )} />
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon platform={api.icon} size={14} />
                      <span className="text-sm text-foreground">{api.name}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] ml-auto",
                        isLive
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isLive ? "Live" : "Mock"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                When an API key is not configured, R3viewRadar falls back to simulated data so you can still explore the interface. Configure API keys via environment variables for live data.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="gap-2 font-semibold px-8">
              Try a search
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>&copy; 2026 R3viewRadar</span>
        <a href="https://r3viewradar.com" className="hover:text-foreground transition-colors">r3viewradar.com</a>
      </footer>
    </div>
  );
}
