import { useState } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, signup } = useAuth();
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    setLoginLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      toast({ title: "Welcome back!", description: "You've been signed in." });
      setLocation("/");
    } catch (err: any) {
      const msg = err?.message?.includes("401") ? "Invalid email or password." : "Login failed. Please try again.";
      toast({ title: "Sign in failed", description: msg, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword) return;
    if (signupPassword !== signupConfirm) {
      toast({ title: "Passwords don't match", description: "Please check your password.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSignupLoading(true);
    try {
      await signup(signupUsername.trim(), signupEmail.trim(), signupPassword);
      toast({ title: "Account created!", description: "Welcome to R3viewRadar." });
      setLocation("/");
    } catch (err: any) {
      const msg = err?.message?.includes("409") ? "Email already registered." : "Sign up failed. Please try again.";
      toast({ title: "Sign up failed", description: msg, variant: "destructive" });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <Logo size={36} />
        <span className="text-xl font-bold tracking-tight text-foreground">
          R3view<span className="text-primary">Radar</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full mb-6" data-testid="auth-tabs">
              <TabsTrigger value="login" className="flex-1" data-testid="tab-login">
                <LogIn size={14} className="mr-1.5" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1" data-testid="tab-signup">
                <UserPlus size={14} className="mr-1.5" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your R3viewRadar account</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <Button
                  data-testid="login-submit"
                  type="submit"
                  className="w-full"
                  disabled={loginLoading || !loginEmail.trim() || !loginPassword}
                >
                  {loginLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn size={15} />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground">Create account</h1>
                <p className="text-muted-foreground text-sm mt-1">Join R3viewRadar to save searches and get alerts</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Username</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="signup-username"
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="yourname"
                      className="pl-9"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pl-9"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      data-testid="signup-confirm"
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button
                  data-testid="signup-submit"
                  type="submit"
                  className="w-full"
                  disabled={signupLoading || !signupUsername.trim() || !signupEmail.trim() || !signupPassword || !signupConfirm}
                >
                  {signupLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus size={15} />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to save your searches and preferences securely.
        </p>
      </div>
    </div>
  );
}
