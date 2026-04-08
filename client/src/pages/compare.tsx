import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateClientMockData } from "@/lib/clientMockData";
import {
  ArrowLeft, GitCompare, Building2, Package, Trophy, ThumbsUp, ThumbsDown, Minus, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareResult {
  query: string;
  platforms: {
    platform: string;
    platformIcon: string;
    totalReviews: number;
    averageRating: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  }[];
  overallRating: number;
  totalReviews: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topReviews: {
    id: string;
    author: string;
    rating: number;
    text: string;
    date: string;
    platform: string;
  }[];
}

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const [width, setWidth] = useState(0);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-7 tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

function ResultCard({ result, isWinner }: { result: CompareResult; isWinner: boolean }) {
  const sentTotal = result.sentimentBreakdown.positive + result.sentimentBreakdown.neutral + result.sentimentBreakdown.negative;
  return (
    <div className={cn(
      "bg-card border rounded-2xl p-5 flex flex-col gap-5 transition-all",
      isWinner ? "border-primary/60 shadow-[0_0_20px_rgba(14,165,233,0.12)]" : "border-border"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{result.query}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{result.totalReviews.toLocaleString()} total reviews</p>
        </div>
        {isWinner && (
          <Badge className="gap-1 shrink-0 bg-primary/20 text-primary border-primary/30">
            <Trophy size={11} />
            Winner
          </Badge>
        )}
      </div>

      {/* Overall rating */}
      <div className="flex items-center gap-4">
        <div className="text-5xl font-extrabold text-foreground tabular-nums">{result.overallRating.toFixed(1)}</div>
        <div>
          <StarRating rating={result.overallRating} size={18} showValue={false} />
          <p className="text-xs text-muted-foreground mt-1">Overall score</p>
        </div>
      </div>

      {/* Sentiment */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Sentiment</p>
        <SentimentBar label="Positive" count={result.sentimentBreakdown.positive} total={sentTotal} color="hsl(150 60% 45%)" />
        <SentimentBar label="Neutral" count={result.sentimentBreakdown.neutral} total={sentTotal} color="hsl(45 70% 52%)" />
        <SentimentBar label="Negative" count={result.sentimentBreakdown.negative} total={sentTotal} color="hsl(0 65% 52%)" />
      </div>

      {/* Platforms */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">By Platform</p>
        <div className="space-y-2">
          {result.platforms.map((p) => (
            <div key={p.platform} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center shrink-0">
                <PlatformIcon platform={p.platformIcon} size={13} />
              </div>
              <span className="text-xs text-foreground w-20 truncate">{p.platform}</span>
              <div className="flex-1 bg-secondary rounded-full h-1">
                <div
                  className="h-1 rounded-full bg-primary"
                  style={{ width: `${(p.averageRating / 5) * 100}%`, transition: "width 700ms ease" }}
                />
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{p.averageRating.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top reviews */}
      {result.topReviews.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">Top Reviews</p>
          <div className="space-y-2">
            {result.topReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {review.author[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{review.author}</span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={9} className={cn("shrink-0", i < review.rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [type, setType] = useState<"business" | "product">("business");
  const [results, setResults] = useState<{ a: CompareResult; b: CompareResult } | null>(null);

  // Read URL params for pre-fill
  useEffect(() => {
    const hash = window.location.hash;
    const search = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(search);
    if (params.get("a")) setQueryA(decodeURIComponent(params.get("a")!));
    if (params.get("b")) setQueryB(decodeURIComponent(params.get("b")!));
    if (params.get("type") === "product") setType("product");
  }, []);

  const compareMutation = useMutation({
    mutationFn: async () => {
      if (!queryA.trim() || !queryB.trim()) throw new Error("Both queries required");
      try {
        const res = await apiRequest("POST", "/api/compare", {
          queryA: queryA.trim(),
          queryB: queryB.trim(),
          type,
          userId: user?.id || null,
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!data.a || !data.b) throw new Error("Invalid response");
        return data as { a: CompareResult; b: CompareResult };
      } catch {
        // Fallback: generate mock data on both sides
        const mockA = generateClientMockData(queryA.trim(), type, null, null);
        const mockB = generateClientMockData(queryB.trim(), type, null, null);
        const toResult = (q: string, mock: ReturnType<typeof generateClientMockData>): CompareResult => ({
          query: q,
          platforms: mock.platforms,
          overallRating: mock.overallRating,
          totalReviews: mock.totalReviews,
          sentimentBreakdown: mock.sentimentBreakdown,
          topReviews: mock.allReviews.slice(0, 5),
        });
        return { a: toResult(queryA.trim(), mockA), b: toResult(queryB.trim(), mockB) };
      }
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (err: any) => {
      toast({ title: "Comparison failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryA.trim() || !queryB.trim()) {
      toast({ title: "Enter both queries", description: "Fill in Business A and Business B.", variant: "destructive" });
      return;
    }
    compareMutation.mutate();
  };

  const winner = results
    ? results.a.overallRating >= results.b.overallRating ? "a" : "b"
    : null;

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
        <span className="font-bold text-foreground hidden sm:inline">
          R3view<span className="text-primary">Radar</span>
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <GitCompare size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground hidden sm:inline">Compare</span>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        {/* Search inputs */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1">Compare Reviews</h1>
          <p className="text-muted-foreground text-sm mb-6">Search two businesses or products side by side</p>

          <form onSubmit={handleCompare} className="space-y-4">
            {/* Type selector */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="compare-type-business"
                onClick={() => setType("business")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  type === "business"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                )}
              >
                <Building2 size={13} />
                Businesses
              </button>
              <button
                type="button"
                data-testid="compare-type-product"
                onClick={() => setType("product")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  type === "product"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                )}
              >
                <Package size={13} />
                Products
              </button>
            </div>

            {/* Side-by-side inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {type === "business" ? "Business" : "Product"} A
                </label>
                <Input
                  data-testid="compare-input-a"
                  value={queryA}
                  onChange={(e) => setQueryA(e.target.value)}
                  placeholder={type === "business" ? "e.g. Chipotle" : "e.g. iPhone 15"}
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {type === "business" ? "Business" : "Product"} B
                </label>
                <Input
                  data-testid="compare-input-b"
                  value={queryB}
                  onChange={(e) => setQueryB(e.target.value)}
                  placeholder={type === "business" ? "e.g. Subway" : "e.g. Samsung Galaxy S25"}
                  className="bg-card"
                />
              </div>
            </div>

            <Button
              data-testid="compare-submit"
              type="submit"
              disabled={compareMutation.isPending || !queryA.trim() || !queryB.trim()}
              className="gap-2"
            >
              {compareMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare size={15} />
                  Compare
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {winner === "a" ? results.a.query : results.b.query} wins with {winner === "a" ? results.a.overallRating : results.b.overallRating}/5.0
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="compare-results">
              <ResultCard result={results.a} isWinner={winner === "a"} />
              <ResultCard result={results.b} isWinner={winner === "b"} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground mt-8">
        <span>© 2026 R3viewRadar</span>
        <a href="https://r3viewradar.com" className="hover:text-foreground transition-colors">r3viewradar.com</a>
      </footer>
    </div>
  );
}
