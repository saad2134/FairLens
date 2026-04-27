"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import NavbarComponent from "@/components/navbar/navbar";
import FooterSection from "@/components/footer/footer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Scale,
  FileText,
  ArrowRight,
  Brain,
  Gauge,
  Zap,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Fairness Metrics",
    description: "Compute demographic parity, equal opportunity, disparate impact, and equalized odds metrics.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "SHAP Explanations",
    description: "Understand model decisions with SHAP values for each prediction.",
    color: "primary",
    highlighted: true,
  },
  {
    icon: FileText,
    title: "Interactive Reports",
    description: "Comprehensive heatmaps and visualizations to identify bias at a glance.",
    color: "primary",
  },
  {
    icon: Gauge,
    title: "Enterprise Ready",
    description: "Model-format agnosticism with audit versioning for compliance.",
    color: "primary",
  },
];

const metrics = [
  { name: "Demographic Parity", description: "Gap in positive prediction rates between groups" },
  { name: "Equal Opportunity", description: "Gap in true positive rates" },
  { name: "Disparate Impact", description: "80% rule compliance check" },
  { name: "Equalized Odds", description: "Combined TPR + FPR parity" },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("fairlens_token");
    const id = localStorage.getItem("fairlens_id");
    if (token && id) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavbarComponent />
      
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Enterprise AI Fairness Auditing
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Detect & Mitigate Bias in{" "}
              <span className="text-primary">AI Systems</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {siteConfig.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={handleGetStarted} size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Fairness Auditing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry-leading metrics to identify and address bias in your machine learning models
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`card ${feature.highlighted ? 'border-primary border-2' : ''}`}
              >
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Fairness Metrics We Compute
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry-standard metrics to measure and track AI fairness
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="card flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{metric.name}</h3>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Ensure Fair AI?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start auditing your models today and build fairer AI systems
          </p>
          <button 
            onClick={handleGetStarted}
            className="btn-primary text-lg px-8 py-3"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}