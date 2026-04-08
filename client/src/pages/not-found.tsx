import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <Logo size={48} />
      <h1 className="text-2xl font-bold text-foreground mt-6 mb-2">Page not found</h1>
      <p className="text-muted-foreground text-sm mb-6">This page doesn't exist or the search has expired.</p>
      <Link href="/">
        <Button variant="secondary" className="gap-2">
          <ArrowLeft size={14} />
          Back to search
        </Button>
      </Link>
    </div>
  );
}
