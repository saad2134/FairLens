"use client";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  name: string;
  link: string;
}

interface NavbarProps {
  navItems?: NavItem[];
  showModeToggle?: boolean;
}

const navItems = [
  { name: "Features", link: "/#features" },
  { name: "Pricing", link: "/pricing" },
];

export default function NavbarComponent({
  navItems: customNavItems,
  showModeToggle = true,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();

  const items = customNavItems || navItems;

  const handleNavClick = (item: NavItem) => {
    if (item.link.startsWith("#")) {
      const element = document.getElementById(item.link.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(item.link);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 w-full">
      <div className="mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start bg-background/90 backdrop-blur-md px-6 py-3 lg:flex border-b border-border">
<Link href="/" className="flex items-center gap-2">
            <Image 
              src="/favicon.svg" 
              alt="FairLens" 
              width={32} 
              height={32} 
              className="w-8 h-8"
            />
            <span className="font-bold text-xl text-foreground">{siteConfig.name}</span>
          </Link>

        <div className="hidden flex-row items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
          {items.map((item, idx) => (
            <button
              key={`link-${idx}`}
              onClick={() => handleNavClick(item)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-all animate-pulse"
          >
            Try Demo
          </Link>
          {showModeToggle && (
            <DropdownMenu open={isThemeDropdownOpen} onOpenChange={setIsThemeDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="cursor-pointer border-border">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={() => { setTheme("light"); setIsThemeDropdownOpen(false); }}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setTheme("dark"); setIsThemeDropdownOpen(false); }}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setTheme("system"); setIsThemeDropdownOpen(false); }}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="relative top-0 z-50 mx-auto flex w-full flex-col items-center justify-between bg-background/95 backdrop-blur-xl px-4 py-3 lg:hidden border-b border-border">
        <div className="flex w-full flex-row items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/favicon.svg" 
              alt="FairLens" 
              width={32} 
              height={32} 
              className="w-8 h-8"
            />
            <span className="font-bold text-xl text-foreground">{siteConfig.name}</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-foreground p-2">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start justify-start gap-4 bg-background/95 backdrop-blur-xl px-4 py-6 border-b border-border shadow-xl">
            {items.map((item, idx) => (
              <button
                key={`mobile-link-${idx}`}
                onClick={() => handleNavClick(item)}
                className="text-foreground hover:text-primary transition-colors py-2"
              >
                {item.name}
              </button>
            ))}
            <div className="flex flex-col gap-2 w-full mt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center px-4 py-2 rounded-lg border border-border text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}