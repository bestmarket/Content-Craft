import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default";
}

export default function ThemeToggle({ className = "", size = "default" }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`rounded-full transition-all ${
        size === "sm" ? "w-8 h-8" : "w-9 h-9"
      } ${
        isDark
          ? "text-sky-300 hover:bg-sky-950/60 hover:text-sky-200"
          : "text-muted-foreground hover:bg-blue-50 hover:text-foreground"
      } ${className}`}
    >
      {isDark ? (
        <Sun className={size === "sm" ? "w-4 h-4" : "w-4.5 h-4.5"} />
      ) : (
        <Moon className={size === "sm" ? "w-4 h-4" : "w-4.5 h-4.5"} />
      )}
    </Button>
  );
}
