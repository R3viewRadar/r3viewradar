import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft, Heart, Bell, GitCompare, Trash2, Search,
  RefreshCw, User, Mail, Calendar, LogOut, Building2, Package
} from "lucide-react";
import type { Favorite, Alert, Comparison } from "@shared/schema";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: favs = [] } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", `/api/favorites/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: userAlerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", `/api/alerts/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: comparisons = [] } = useQuery<Comparison[]>({
    queryKey: ["/api/comparisons", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // We don't have a separate endpoint, use favorites endpoint structure
      return [];
    },
    enabled: !!user,
  });

  const deleteFavMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/favorites/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/favorites", user?.id] });
      toast({ title: "Favorite removed" });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alerts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/alerts", user?.id] });
      toast({ title: "Alert deleted" });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/alerts", user?.id] });
    },
  });

  const handleSearchAgain = (fav: Favorite) => {
    setLocation(`/?q=${encodeURIComponent(fav.query)}&type=${fav.type}`);
  };

  const handleCompareAgain = (comp: Comparison) => {
    setLocation(`/compare?a=${encodeURIComponent(comp.queryA)}&b=${encodeURIComponent(comp.queryB)}&type=${comp.type}`);
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Signed out", description: "See you next time!" });
    setLocation("/");
  };

  if (!user) return null;

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
        <div className="flex-1" />
        <Button
          data-testid="logout-button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </header>

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground" data-testid="profile-username">
                {user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail size={12} />
                  {user.email}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  Member since {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary">{favs.length} Favorites</Badge>
                <Badge variant="secondary">{userAlerts.length} Alerts</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Saved Searches</h2>
            <Badge variant="secondary" className="ml-auto">{favs.length}</Badge>
          </div>
          {favs.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Heart size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No saved searches yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Heart a search result to save it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favs.map((fav) => (
                <div
                  key={fav.id}
                  data-testid={`favorite-item-${fav.id}`}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {fav.type === "business" ? <Building2 size={14} className="text-primary" /> : <Package size={14} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fav.query}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{fav.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(fav.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      data-testid={`fav-search-${fav.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSearchAgain(fav)}
                      className="text-muted-foreground hover:text-primary gap-1.5 text-xs"
                    >
                      <Search size={12} />
                      Search again
                    </Button>
                    <Button
                      data-testid={`fav-delete-${fav.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFavMutation.mutate(fav.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Alerts */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Review Alerts</h2>
            <Badge variant="secondary" className="ml-auto">{userAlerts.length}</Badge>
          </div>
          {userAlerts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Bell size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No active alerts.</p>
              <p className="text-muted-foreground text-xs mt-1">Set a bell alert on search results to monitor businesses.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userAlerts.map((alert) => (
                <div
                  key={alert.id}
                  data-testid={`alert-item-${alert.id}`}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Bell size={14} className={alert.active ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{alert.query}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alert.type}</Badge>
                      {alert.active ? (
                        <span className="text-xs text-green-500">Active</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Paused</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      data-testid={`alert-toggle-${alert.id}`}
                      checked={!!alert.active}
                      onCheckedChange={() => toggleAlertMutation.mutate(alert.id)}
                    />
                    <Button
                      data-testid={`alert-delete-${alert.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comparisons */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <GitCompare size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Recent Comparisons</h2>
            <Badge variant="secondary" className="ml-auto">{comparisons.length}</Badge>
          </div>
          {comparisons.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <GitCompare size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No comparisons yet.</p>
              <p className="text-muted-foreground text-xs mt-1 mb-4">Use the Compare page to compare two businesses or products side by side.</p>
              <Link href="/compare">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <GitCompare size={13} />
                  Go to Compare
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {comparisons.map((comp) => (
                <div
                  key={comp.id}
                  data-testid={`comparison-item-${comp.id}`}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {comp.queryA} <span className="text-muted-foreground font-normal mx-1">vs</span> {comp.queryB}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{comp.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(comp.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    data-testid={`comp-again-${comp.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCompareAgain(comp)}
                    className="text-muted-foreground hover:text-primary gap-1.5 text-xs shrink-0"
                  >
                    <RefreshCw size={12} />
                    Compare again
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>© 2026 R3viewRadar</span>
        <a href="https://r3viewradar.com" className="hover:text-foreground transition-colors">r3viewradar.com</a>
      </footer>
    </div>
  );
}
