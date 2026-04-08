import {
  SiGoogle,
  SiYelp,
  SiTripadvisor,
  SiFacebook,
  SiReddit,
  SiTrustpilot,
} from "react-icons/si";
import { ShoppingBag, Globe, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  yelp: "#FF1A1A",
  tripadvisor: "#34E0A1",
  facebook: "#1877F2",
  reddit: "#FF4500",
  amazon: "#FF9900",
  trustpilot: "#00B67A",
  bestbuy: "#0046BE",
};

function AmazonIcon({ size = 16, color = "#FF9900" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705a.657.657 0 0 1-.743.074c-1.045-.868-1.231-1.271-1.804-2.097-1.726 1.759-2.95 2.286-5.187 2.286-2.649 0-4.711-1.633-4.711-4.904 0-2.554 1.383-4.291 3.351-5.138 1.697-.748 4.07-.882 5.886-1.088v-.407c0-.748.059-1.63-.384-2.276-.383-.578-1.114-.816-1.758-.816-1.197 0-2.256.612-2.517 1.88-.053.283-.261.561-.543.574L7.08 5.64c-.232-.051-.488-.239-.421-.592.662-3.478 3.802-4.529 6.613-4.529 1.438 0 3.316.383 4.451 1.467 1.439 1.343 1.301 3.133 1.301 5.083v4.604c0 1.383.574 1.991 1.114 2.738.188.266.228.583-.009.778-.603.506-1.674 1.445-2.263 1.971l-.723-.556z"/>
      <path d="M20.16 17.53c-1.963 1.449-4.808 2.22-7.256 2.22-3.43 0-6.52-1.269-8.857-3.379-.184-.166-.02-.393.201-.264 2.52 1.466 5.638 2.349 8.852 2.349 2.169 0 4.556-.449 6.751-1.381.331-.141.609.217.309.455z"/>
      <path d="M21.034 16.54c-.25-.321-1.652-.152-2.284-.076-.191.023-.221-.144-.048-.265 1.119-.786 2.955-.559 3.167-.296.213.264-.055 2.103-1.105 2.979-.161.136-.315.063-.243-.115.236-.587.763-1.906.513-2.227z"/>
    </svg>
  );
}

function BestBuyIcon({ size = 16, color = "#0046BE" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect width="24" height="24" rx="3" fill={color} />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">BB</text>
    </svg>
  );
}

type IconComponent = React.ComponentType<{ size?: number; color?: string; className?: string }>;

const PLATFORM_ICONS: Record<string, IconComponent> = {
  google: SiGoogle as unknown as IconComponent,
  yelp: SiYelp as unknown as IconComponent,
  tripadvisor: SiTripadvisor as unknown as IconComponent,
  facebook: SiFacebook as unknown as IconComponent,
  reddit: SiReddit as unknown as IconComponent,
  trustpilot: SiTrustpilot as unknown as IconComponent,
  amazon: AmazonIcon as IconComponent,
  bestbuy: BestBuyIcon as IconComponent,
};

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  withColor?: boolean;
}

export function PlatformIcon({ platform, size = 16, className, withColor = true }: PlatformIconProps) {
  const key = platform.toLowerCase().replace(/[\s-]/g, "").replace("buy", "buy");
  const Icon = PLATFORM_ICONS[key];
  const color = withColor ? PLATFORM_COLORS[key] : "currentColor";

  if (!Icon) {
    return <Globe size={size} className={cn("text-muted-foreground", className)} />;
  }

  return <Icon size={size} color={color} className={cn(className)} />;
}

export function getPlatformColor(platform: string): string {
  const key = platform.toLowerCase().replace(/[\s-]/g, "");
  return PLATFORM_COLORS[key] ?? "#6b7280";
}
