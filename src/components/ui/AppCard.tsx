import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, hover = false, clickable = false, onClick, style, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "card-graphite p-6",
        (hover || clickable) && "card-hover cursor-pointer hover:border-select/30 hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
