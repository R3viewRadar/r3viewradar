import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Search, Building2, Package, ExternalLink,
  ThumbsUp, ThumbsDown, Minus, CheckCircle, Filter,
  ChevronDown, Star, Globe, TrendingUp, Wifi, WifiOff, AlertCircle, MapPin
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StarRating } from "@/components/StarRating";
import { PlatformIcon, getPlatformColor } from "@/components/PlatformIcon";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResultData, Review, ReviewResult, SourceLink, NearbyLocation } from "@shared/schema";
import { consumePendingResult } from "@/lib/searchStore";
import { cn } from "@/lib/utils";

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const pct = animated / 5;
  const strokeDash = circ * pct;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score >= 4 ? "hsl(192 85% 52%)" : score >= 3 ? "hsl(45 70% 52%)" : "hsl(0 65% 52%)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circ}`}
          style={{ transition: "stroke-dasharray 800ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground tabular-nums">{score.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/ 5.0</span>
      </div>
    </div>
  );
}

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const [width, setWidth] = useState(0);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full sentiment-bar"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

function PlatformRow({ platform, onClick, active }: { platform: ReviewResult; onClick: () => void; active: boolean }) {
  return (
    <button
      data-testid={`platform-row-${platform.platform.toLowerCase()}`}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg platform-row text-left border transition-all",
        active
          ? "border-primary/40 bg-secondary"
          : "border-transparent"
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted shrink-0">
        <PlatformIcon platform={platform.platformIcon} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{platform.platform}</span>
          <span className="text-xs font-bold text-foreground tabular-nums">{platform.averageRating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={platform.averageRating} size={10} />
          <span className="text-xs text-muted-foreground">{platform.totalReviews.toLocaleString()} reviews</span>
        </div>
      </div>
    </button>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 160;

  return (
    <div
      data-testid={`review-card-${review.id}`}
      className="review-card bg-card border border-border rounded-lg p-4 cursor-default"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground shrink-0">
            {review.author[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{review.author}</span>
              {review.verified && (
                <CheckCircle size={12} className="text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size={11} />
              <span className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="platform-badge shrink-0">
          <PlatformIcon platform={review.platform} size={11} />
          <span className="hidden sm:inline">{review.platform}</span>
        </div>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {!expanded && isLong ? review.text.slice(0, 160) + "…" : review.text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary mt-1.5 hover:text-primary/80 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      {review.helpful !== undefined && review.helpful > 0 && (
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <ThumbsUp size={11} />
          <span>{review.helpful} found helpful</span>
        </div>
      )}
    </div>
  );
}

function SkeletonResults() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-secondary rounded w-32 animate-pulse" />
        <div className="h-8 bg-secondary rounded w-64 animate-pulse" />
        <div className="h-4 bg-secondary rounded w-48 animate-pulse" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="h-3 bg-secondary rounded w-24 mb-4 animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-secondary rounded w-full animate-pulse" />
                <div className="h-3 bg-secondary rounded w-3/4 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scanning indicator */}
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <Wifi size={16} className="absolute text-primary animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Scanning platforms...</p>
          <p className="text-xs text-muted-foreground">Querying Google, Yelp, Reddit, and more</p>
        </div>
      </div>

      {/* Review skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  // Consume pending client-side data on first mount (static hosting fallback)
  const [clientData] = useState<SearchResultData | null>(() => consumePendingResult());
  const reviewsRef = useRef<HTMLDivElement>(null);

  const { data: apiData, isLoading, error } = useQuery<SearchResultData>({
    queryKey: ["/api/search", params.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/search/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !clientData, // Skip API call if we have client-side data
    retry: false,
  });

  // Use client-side data if available, otherwise API data
  const data = clientData ?? apiData;

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle size={40} className="text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md">
          We couldn't load the results for this search. The data may have expired or a server error occurred.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft size={14} />
            Back to search
          </Button>
        </Link>
      </div>
    );
  }

  const platformResults = activePlatform
    ? data?.platforms.filter(p => p.platform === activePlatform) ?? []
    : data?.platforms ?? [];

  let reviews: Review[] = data?.allReviews ?? [];
  if (activePlatform) {
    reviews = reviews.filter(r => r.platform === activePlatform);
  }
  if (filterRating !== null) {
    reviews = reviews.filter(r => r.rating === filterRating);
  }

  reviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "highest") return b.rating - a.rating;
    return a.rating - b.rating;
  });

  const positiveTotal = data?.sentimentBreakdown.positive ?? 0;
  const neutralTotal = data?.sentimentBreakdown.neutral ?? 0;
  const negativeTotal = data?.sentimentBreakdown.negative ?? 0;
  const sentimentTotal = positiveTotal + neutralTotal + negativeTotal;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <button className="flex items-center gap-2 mr-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <Logo size={24} />
        <span className="font-bold text-foreground hidden sm:inline">R3view<span className="text-primary">Radar</span></span>
        <div className="flex-1 max-w-md">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border cursor-pointer hover:border-primary/30 transition-all text-sm text-muted-foreground">
              <Search size={13} />
              <span className="truncate">{data?.search.query ?? "Search..."}</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        {(isLoading && !clientData) ? (
          <SkeletonResults />
        ) : data ? (
          <>
            {/* Result header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {data.search.type === "business"
                    ? <Building2 size={14} className="text-primary" />
                    : <Package size={14} className="text-primary" />
                  }
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                    {data.search.type === "business" ? "Business" : "Product"} · {data.search.category ?? "All categories"}
                    {data.search.location && (
                      <> · <MapPin size={10} className="inline" /> {data.search.location.match(/^-?\d+\./) ? "Near me" : data.search.location}</>
                    )}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{data.search.query}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {data.totalReviews.toLocaleString()} reviews across {data.platforms.length} platforms
                </p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Overall score */}
              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-5">
                <ScoreRing score={data.overallRating} size={88} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Overall Score</p>
                  <StarRating rating={data.overallRating} size={16} showValue={false} />
                  <p className="text-sm text-muted-foreground mt-1">{data.totalReviews.toLocaleString()} total reviews</p>
                </div>
              </div>

              {/* Sentiment */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Sentiment</p>
                <div className="space-y-2.5">
                  <SentimentBar
                    label="Positive"
                    count={positiveTotal}
                    total={sentimentTotal}
                    color="hsl(var(--color-positive))"
                  />
                  <SentimentBar
                    label="Neutral"
                    count={neutralTotal}
                    total={sentimentTotal}
                    color="hsl(var(--color-neutral))"
                  />
                  <SentimentBar
                    label="Negative"
                    count={negativeTotal}
                    total={sentimentTotal}
                    color="hsl(var(--color-negative))"
                  />
                </div>
              </div>

              {/* Top platform */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Best Rated Platform</p>
                {(() => {
                  const best = [...(data.platforms)].sort((a, b) => b.averageRating - a.averageRating)[0];
                  if (!best) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <PlatformIcon platform={best.platformIcon} size={22} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{best.platform}</p>
                          <p className="text-xs text-muted-foreground">{best.totalReviews.toLocaleString()} reviews</p>
                        </div>
                      </div>
                      <StarRating rating={best.averageRating} size={14} showValue />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Source Links */}
            {data.sourceLinks && data.sourceLinks.length > 0 && (
              <div className="mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Source Links</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.sourceLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`source-link-${link.platform.toLowerCase()}`}
                      className="flex items-start gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 hover:bg-accent/10 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <PlatformIcon platform={link.platformIcon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground truncate">{link.title}</span>
                          <ExternalLink size={10} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{link.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Locations picker */}
            {data.nearbyLocations && data.nearbyLocations.length > 0 && (
              <div className="mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">
                  <MapPin size={10} className="inline mr-1" />
                  Nearby Locations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.nearbyLocations.map((loc) => (
                    <button
                      key={loc.id}
                      data-testid={`location-${loc.id}`}
                      className="flex items-start gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 hover:bg-accent/10 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{loc.name}</span>
                          {loc.distance && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">{loc.distance}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{loc.address}</p>
                        {loc.rating && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <StarRating rating={loc.rating} size={10} showValue />
                            {loc.reviewCount && (
                              <span className="text-[10px] text-muted-foreground">({loc.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Platform breakdown + Reviews grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: platform list */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-3 sticky top-20">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest px-2 py-1.5 mb-1">Platforms</p>
                  <button
                    onClick={() => setActivePlatform(null)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all border mb-1",
                      activePlatform === null
                        ? "border-primary/40 bg-secondary font-semibold text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Globe size={14} className="text-primary" />
                    <span>All Platforms</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{data.platforms.length}</Badge>
                  </button>
                  {data.platforms
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .map(p => (
                      <PlatformRow
                        key={p.platform}
                        platform={p}
                        active={activePlatform === p.platform}
                        onClick={() => setActivePlatform(activePlatform === p.platform ? null : p.platform)}
                      />
                    ))}
                </div>
              </div>

              {/* Main: reviews */}
              <div className="lg:col-span-3">
                {/* Platform stats row (when specific platform selected) */}
                {activePlatform && platformResults.length > 0 && (
                  <div className="bg-accent/20 border border-primary/20 rounded-xl p-4 mb-4 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={platformResults[0].platformIcon} size={22} />
                      <span className="font-semibold text-foreground">{platformResults[0].platform}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={platformResults[0].averageRating} size={14} showValue />
                    </div>
                    <span className="text-sm text-muted-foreground">{platformResults[0].totalReviews.toLocaleString()} reviews</span>
                    {platformResults[0].url && (
                      <a href={platformResults[0].url} target="_blank" rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                        <ExternalLink size={12} />
                        View on {platformResults[0].platform}
                      </a>
                    )}
                  </div>
                )}

                {/* Sort & filter bar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap" ref={reviewsRef}>
                  <span className="text-sm text-muted-foreground mr-auto">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    {activePlatform ? ` from ${activePlatform}` : " across all platforms"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[5, 4, 3, 2, 1].map(r => (
                      <button
                        key={r}
                        onClick={() => setFilterRating(filterRating === r ? null : r)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all",
                          filterRating === r
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <Star size={10} className="fill-current" />
                        {r}
                      </button>
                    ))}
                  </div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs bg-secondary border border-border rounded px-2 py-1.5 text-foreground"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </div>

                {/* Review feed */}
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Filter size={32} className="text-muted-foreground mb-3" />
                    <p className="text-foreground font-semibold">No reviews match this filter</p>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">Try clearing your filters or selecting a different rating</p>
                    <Button variant="secondary" onClick={() => { setFilterRating(null); setActivePlatform(null); }}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground mt-8">
        <span>&copy; 2026 R3viewRadar</span>
        <a href="https://r3viewradar.com" className="hover:text-foreground transition-colors">r3viewradar.com</a>
      </footer>
    </div>
  );
}
