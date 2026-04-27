"use client";

import * as React from "react";
import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { siteConfig, SOCIAL_LINKS } from "@/config/site";

function Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="footer"
      className={`mx-auto w-full bg-white border-t border-gray-200 ${className}`}
      {...props}
    />
  );
}

function FooterContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-8 ${className}`}
      {...props}
    />
  );
}

function FooterColumn({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`flex flex-col gap-4 ${className}`} {...props} />
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
      appName: "Product",
      links: [
        { text: "Features", href: "/#features" },
        { text: "How It Works", href: "/#how-it-works" },
        { text: "Pricing", href: "/pricing" },
      ],
    },
    {
      appName: "Resources",
      links: [
        { text: "Documentation", href: "/docs" },
        { text: "API Reference", href: "/api-docs" },
        { text: "Blog", href: "/blog" },
      ],
    },
    {
      appName: "Company",
      links: [
        { text: "About", href: "/about" },
        { text: "Careers", href: "/careers" },
        { text: "Contact", href: "/contact" },
      ],
    },
    {
      appName: "Legal",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
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
    <footer className="w-full py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Footer>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <FooterColumn className="md:col-span-2">
              <div className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="font-serif text-xl font-bold text-gray-900">{siteConfig.name}</span>
                </Link>
                <p className="text-gray-500 text-sm max-w-md">
                  {siteConfig.description}
                </p>
                <div className="flex items-center gap-4">
                  {SOCIAL_LINKS.github && (
                    <Link
                      href={SOCIAL_LINKS.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
            </FooterColumn>

            {/* Link Columns */}
            {columns.map((column, index) => (
              <FooterColumn key={index}>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {column.appName}
                </h3>
                <div className="flex flex-col gap-2">
                  {column.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </FooterColumn>
            ))}
          </div>
        </Footer>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer, FooterColumn, FooterContent };