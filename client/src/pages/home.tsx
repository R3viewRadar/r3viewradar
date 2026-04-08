import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Search, Building2, Package, Clock, TrendingUp, ArrowRight, ChevronDown, MapPin, Locate, X, GitCompare, User, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import type { SearchResultData, Search as SearchType } from "@shared/schema";
import { generateClientMockData } from "@/lib/clientMockData";
import { setPendingResult } from "@/lib/searchStore";
import { cn } from "@/lib/utils";

const BUSINESS_CATEGORIES = ["Restaurant", "Hotel", "Salon", "Doctor", "Gym", "Dentist", "Store", "Service"];
const PRODUCT_CATEGORIES = ["Electronics", "Clothing", "Appliance", "Software", "Game", "Book", "Toy", "Supplement"];
const BUSINESS_PLATFORMS = ["Google", "Yelp", "TripAdvisor", "Facebook", "Reddit"];
const PRODUCT_PLATFORMS = ["Amazon", "Google", "Reddit", "Trustpilot", "Best Buy"];

const TRENDING = [
  { query: "ChatGPT", type: "product" as const },
  { query: "Airpods Pro", type: "product" as const },
  { query: "Chipotle", type: "business" as const },
  { query: "Tesla", type: "product" as const },
  { query: "Ritz-Carlton", type: "business" as const },
  { query: "Samsung Galaxy S25", type: "product" as const },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchType, setSearchType] = useState<"business" | "product">("business");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoLabel, setGeoLabel] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser doesn't support location services.", variant: "destructive" });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        setLocationInput(coords);
        setGeoLabel("My Location");
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        toast({ title: "Location access denied", description: "Please allow location access or enter a zip code manually.", variant: "destructive" });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [toast]);

  const clearLocation = useCallback(() => {
    setLocationInput("");
    setGeoLabel(null);
  }, []);

  const { data: recentSearches } = useQuery<SearchType[]>({
    queryKey: ["/api/recent"],
    retry: false,
  });

  const searchMutation = useMutation({
    mutationFn: async (data: { query: string; type: string; category?: string | null; location?: string | null }) => {
      try {
        const res = await apiRequest("POST", "/api/search", data);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        // Verify this is actually a search result (not HTML from a static server)
        if (!json || !json.search || !json.platforms) throw new Error("Invalid response");
        return json as SearchResultData;
      } catch {
        // Backend unreachable (static hosting) — generate mock data client-side
        const mockData = generateClientMockData(
          data.query,
          data.type as "business" | "product",
          data.category,
          data.location
        );
        return mockData;
      }
    },
    onSuccess: (data) => {
      // Store data for the results page to pick up
      setPendingResult(data);
      setLocation(`/results/${data.search.id}`);
    },
    onError: () => {
      toast({ title: "Search failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const loc = searchType === "business" && locationInput.trim() ? locationInput.trim() : null;
    searchMutation.mutate({ query: query.trim(), type: searchType, category, location: loc });
  };

  const handleTrending = (item: typeof TRENDING[0]) => {
    setSearchType(item.type);
    setQuery(item.query);
    const loc = item.type === "business" && locationInput.trim() ? locationInput.trim() : null;
    searchMutation.mutate({ query: item.query, type: item.type, category: null, location: loc });
  };

  const handleRecent = (s: SearchType) => {
    setLocation(`/results/${s.id}`);
  };

  const platforms = searchType === "business" ? BUSINESS_PLATFORMS : PRODUCT_PLATFORMS;
  const categories = searchType === "business" ? BUSINESS_CATEGORIES : PRODUCT_CATEGORIES;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight text-foreground">R3view<span className="text-primary">Radar</span></span>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/how-it-works">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-sm hidden sm:flex">
              How it works
            </Button>
          </Link>
          <Link href="/compare">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-sm hidden sm:flex gap-1.5" data-testid="nav-compare">
              <GitCompare size={13} />
              Compare
            </Button>
          </Link>
          {user ? (
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm gap-1.5" data-testid="nav-profile">
                <User size={13} />
                <span className="hidden sm:inline">{user.username}</span>
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm gap-1.5" data-testid="nav-signin">
                <LogIn size={13} />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        {/* Tagline */}
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6 border border-primary/20">
            <TrendingUp size={12} />
            <span>Scanning {platforms.length} platforms in real-time</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            Every review.<br />
            <span className="text-primary">One search.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Search reviews across {BUSINESS_PLATFORMS.concat(PRODUCT_PLATFORMS).filter((v, i, a) => a.indexOf(v) === i).join(", ")} and more — instantly aggregated, sentiment-scored, and ranked.
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex items-center gap-2 mb-5">
          <button
            data-testid="type-business"
            onClick={() => { setSearchType("business"); setCategory(null); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              searchType === "business"
                ? "bg-primary text-primary-foreground border-primary glow-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
            )}
          >
            <Building2 size={14} />
            Businesses & Places
          </button>
          <button
            data-testid="type-product"
            onClick={() => { setSearchType("product"); setCategory(null); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              searchType === "product"
                ? "bg-primary text-primary-foreground border-primary glow-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
            )}
          >
            <Package size={14} />
            Products
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className="search-bar-wrap flex items-center bg-card border border-border rounded-xl overflow-hidden transition-all">
            <Search size={18} className="ml-4 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              data-testid="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === "business"
                ? "Search a restaurant, hotel, service..."
                : "Search a product, app, brand..."}
              className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base py-4 px-3"
            />
            {category && (
              <Badge
                variant="secondary"
                className="mr-2 cursor-pointer text-xs"
                onClick={() => setCategory(null)}
              >
                {category} ×
              </Badge>
            )}
            <Button
              data-testid="search-button"
              type="submit"
              disabled={!query.trim() || searchMutation.isPending}
              className="m-1.5 px-5 font-semibold"
            >
              {searchMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">Search <ArrowRight size={14} /></span>
              )}
            </Button>
          </div>

          {/* Location row (business only) */}
          {searchType === "business" && (
            <div className="flex items-center gap-2 mt-3 w-full">
              <div className="flex items-center flex-1 bg-card border border-border rounded-lg overflow-hidden">
                <MapPin size={15} className="ml-3 text-muted-foreground flex-shrink-0" />
                {geoLabel ? (
                  <div className="flex items-center gap-1.5 flex-1 px-2 py-2">
                    <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={clearLocation}>
                      <Locate size={10} />
                      {geoLabel}
                      <X size={10} />
                    </Badge>
                  </div>
                ) : (
                  <Input
                    data-testid="location-input"
                    value={locationInput}
                    onChange={(e) => { setLocationInput(e.target.value); setGeoLabel(null); }}
                    placeholder="Zip code or city (optional)"
                    className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-sm py-2 px-2"
                  />
                )}
                {locationInput && !geoLabel && (
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="mr-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                data-testid="use-location-button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all shrink-0",
                  geoLabel
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {geoLoading ? (
                  <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <Locate size={13} />
                )}
                <span className="hidden sm:inline">{geoLoading ? "Locating..." : "Use my location"}</span>
              </button>
            </div>
          )}

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? null : cat)}
                className={cn(
                  "platform-badge cursor-pointer transition-all",
                  category === cat && "!bg-primary/20 !border-primary/40 !text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </form>

        {/* Platform coverage */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Covering {searchType === "business" ? "business" : "product"} reviews from
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {platforms.map(p => (
              <div key={p} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <PlatformIcon platform={p} size={16} />
                <span className="hidden sm:inline">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="mt-12 w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Trending searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(item => (
              <button
                key={item.query}
                data-testid={`trending-${item.query.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => handleTrending(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-secondary-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                <PlatformIcon platform={item.type === "business" ? "google" : "amazon"} size={12} />
                {item.query}
                <span className="text-xs text-muted-foreground ml-0.5">
                  {item.type === "business" ? "· place" : "· product"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches && recentSearches.length > 0 && (
          <div className="mt-10 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Recent</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 8).map(s => (
                <button
                  key={s.id}
                  onClick={() => handleRecent(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  {s.type === "business" ? <Building2 size={12} /> : <Package size={12} />}
                  {s.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>© 2026 R3viewRadar</span>
        <div className="flex items-center gap-4">
          <a href="https://r3viewradar.com" className="hover:text-foreground transition-colors">r3viewradar.com</a>
        </div>
      </footer>
    </div>
  );
}
