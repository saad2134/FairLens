"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import { LayoutDashboard, Folder, FileText, LogOut, Bell, Sun, Moon, Plus, Settings } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";

const appNavItems = [
  { items: [{ title: "Dashboard", url: "/demo/dashboard", icon: LayoutDashboard }] },
  { title: "Projects", items: [
    { title: "Projects", url: "/demo/projects", icon: Folder }, 
    { title: "New Audit", url: "/demo/projects/new", icon: Plus }
  ] },
  { title: "Reports", items: [{ title: "Audit Reports", url: "/demo/reports", icon: FileText }] },
];

const pageDescriptions: Record<string, string> = {
  "/demo/dashboard": "Your fairness audit overview and metrics",
  "/demo/projects": "Manage your fairness audit projects",
  "/demo/projects/new": "Create a new fairness audit",
  "/demo/reports": "View and download audit reports",
};

const pageTitles: Record<string, string> = {
  "/demo/dashboard": "Dashboard",
  "/demo/projects": "Projects",
  "/demo/projects/new": "New Audit",
  "/demo/reports": "Audit Reports",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  const handleLogout = () => { router.push("/"); };

  // Find current page - handle dynamic routes
  let pageTitle = "Dashboard";
  let pageDesc = "Your fairness audit overview";
  
  // Check for exact match first
  if (pageTitles[pathname]) {
    pageTitle = pageTitles[pathname];
    pageDesc = pageDescriptions[pathname] || '';
  } else if (pathname.includes('/projects/') && !pathname.endsWith('/projects') && !pathname.endsWith('/new')) {
    // Handle dynamic routes like /demo/projects/[id]
    pageTitle = "Project Details";
    pageDesc = "View detailed fairness audit results and insights";
  }

  return (
    <SidebarProvider defaultOpen={true} className="h-screen">
      <Sidebar collapsible="offcanvas" className="border-r border-border z-40">
        <SidebarHeader className="py-4">
          <div className="flex items-center gap-3 px-2">
            <Link href="/demo/dashboard" className="flex items-center gap-3">
              <Image src="/favicon.svg" alt="FairLens" width={40} height={40} className="w-10 h-10" />
              <div className="flex flex-col">
                <span className="font-bold text-sm">{siteConfig.name}</span>
                <span className="text-xs text-muted-foreground">Demo</span>
              </div>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {appNavItems.map((category) => (
            <SidebarGroup key={category.title || "untitled"}>
              {category.title && <SidebarGroupLabel className="text-primary font-semibold px-2 mb-1">{category.title}</SidebarGroupLabel>}
              <SidebarMenu>
                {category.items?.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={isActive ? "font-medium" : ""}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="p-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Link
                href="/demo/dashboard"
                className="flex-1 flex items-center gap-3 p-2 border border-border rounded-lg transition-colors bg-muted/50 hover:bg-muted"
              >
                <div className="w-9 h-9 rounded-full bg-primary/50 flex items-center justify-center font-semibold text-sm shrink-0">
                  DU
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Demo User</p>
                  <p className="text-xs text-muted-foreground">Demo</p>
                </div>
              </Link>
              <Link
                href="/demo/dashboard"
                className="w-[60px] flex items-center justify-center border border-border p-2 rounded-lg transition-colors bg-muted/50 hover:bg-muted"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground border border-border"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />Logout
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 h-full overflow-auto">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{pageDesc}</p>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="border border-border"><Bell size={18} /></Button>
                </SheetTrigger>
                <SheetContent><SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader></SheetContent>
              </Sheet>
            )}
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative border border-border">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-border">
                  <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}