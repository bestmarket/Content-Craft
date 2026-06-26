import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Globe, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 md:px-12 bg-white border-b">
        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          ViralCraft Studio
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/register">
            <Button>Start Creating</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            The Ultimate AI Content Factory
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Create Viral Content <br className="hidden md:block"/>
            <span className="text-primary">in Minutes.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Your professional content strategist in your pocket. Generate high-converting scripts, viral titles, and stunning thumbnails for YouTube, TikTok, Instagram, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white border-y px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Script Writer</h3>
              <p className="text-slate-600">Generate engaging, high-retention scripts tailored for any platform's algorithm.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Omni-Platform</h3>
              <p className="text-slate-600">Built-in templates for YouTube, TikTok, Instagram Reels, Facebook, and Twitter.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Viral Modeler</h3>
              <p className="text-slate-600">Paste your favorite viral videos and let our AI reverse-engineer their success formula.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 text-center text-slate-500 text-sm">
        <p>© 2024 ViralCraft Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
