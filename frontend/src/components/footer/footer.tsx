"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Github } from "lucide-react";
import { siteConfig, SOCIAL_LINKS } from "@/config/site";

function Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="footer"
      className={cn(
        "mx-auto mb-8 w-full max-w-7xl rounded-2xl p-6 shadow-xl backdrop-blur-md border border-border/20 dark:border-border/50",
        className,
      )}
      {...props}
    />
  );
}

function FooterContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="footer-content"
      className={cn(
        "grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-2",
        className,
      )}
      {...props}
    />
  );
}

function FooterColumn({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="footer-column"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function FooterBottom({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="footer-bottom"
      className={cn(
        "mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 pb-2 text-xs text-muted-foreground sm:flex-row",
        className,
      )}
      {...props}
    />
  );
}

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumnProps {
  appName: string;
  links: FooterLink[];
}

export default function FooterSection({
  columns = [
    {
      appName: "Application",
      links: [
        { text: "Home", href: "/" },
        { text: "Login", href: "/login" },
        { text: "Signup", href: "/signup" },
      ],
    },
    {
      appName: "Resources",
      links: [
        { text: "Help Center", href: "/help-center" },
        { text: "Blog", href: "/blog" },
        { text: "Careers", href: "/careers" },
      ],
    },
    {
      appName: "Legal",
      links: [
        { text: "Privacy Policy", href: "/policy" },
        { text: "Terms of Service", href: "/terms" },
        { text: "Cookie Policy", href: "/cookies" },
      ],
    },
  ],
  copyright = `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
}: {
  columns?: FooterColumnProps[];
  copyright?: string;
}) {
  return (
    <footer className="relative w-full px-8 pt-14 pb-8">
      <div className="max-w-7xl mx-auto ">
        <Footer className="bg-muted/10">
          <FooterContent className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            <FooterColumn className="lg:col-span-2">
              <div className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/favicon.svg" alt="Logo" width={24} height={24} className="text-primary" />
                  <span className="font-bold text-lg text-foreground">{siteConfig.name}</span>
                </Link>
                <p className="text-muted-foreground text-sm max-w-md">
                  {siteConfig.description}
                </p>
                {SOCIAL_LINKS.github && (
                  <Link
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    {/* <span>GitHub</span> */}
                  </Link>
                )}
              </div>
            </FooterColumn>

            {columns.map((column, index) => (
              <FooterColumn key={index} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {column.appName}
                </h3>
                <div className="flex flex-col gap-2">
                  {column.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </FooterColumn>
            ))}
          </FooterContent>
        </Footer>

        <div className="flex flex-col items-center justify-center w-full mt-8 gap-3">
          <div className="text-sm text-muted-foreground">
            {copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer, FooterColumn, FooterContent, FooterBottom };