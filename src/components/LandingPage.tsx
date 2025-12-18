import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronLeft, ChevronRight, Trash2, FileText } from "lucide-react";
import { marked } from "marked";
import hljs from "highlight.js";

const DEMO_MARKDOWN = `# Welcome to md2slides

Transform your markdown into beautiful presentations in seconds.

# Why md2slides?

- ✨ **Simple** - Just write markdown
- ⚡ **Fast** - Real-time preview
- 🎨 **Beautiful** - Clean, professional slides
- 🚀 **Free** - No account needed

# Your Title
Your content goes here!

# Another Slide
- Point one
- Point two

# Get Started Today

Create your first presentation in minutes.
No design skills required.`;

function parseSlides(text: string): string[] {
  const lines = text.split("\n");
  const slides: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#{1,2} /.test(line)) {
      if (current.length > 0) {
        slides.push(current.join("\n"));
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    slides.push(current.join("\n"));
  }

  return slides.length > 0 ? slides : ["# Welcome"];
}

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userGists, setUserGists] = useState<any[]>([]);
  const [loadingGists, setLoadingGists] = useState(true);
  const slides = parseSlides(DEMO_MARKDOWN);

  // Fetch user's gists
  useEffect(() => {
    fetch("/api/gist/list")
      .then(res => res.json())
      .then(data => {
        setUserGists(data.gists || []);
        setLoadingGists(false);
      })
      .catch(() => {
        setLoadingGists(false);
      });
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Highlight code blocks
  useEffect(() => {
    document.querySelectorAll("#demo-slide pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [currentSlide]);

  const slideHtml = marked.parse(slides[currentSlide] || "") as string;

  const handleOpenGist = (gistId: string) => {
    window.location.hash = `/editor?gist=${gistId}`;
  };

  const handleDeleteGist = async (gistId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    
    try {
      const response = await fetch(`/api/gist/delete/${gistId}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      
      if (response.ok) {
        setUserGists(prev => prev.filter(g => g.id !== gistId));
      } else {
        alert("Failed to delete gist");
      }
    } catch (error) {
      alert("Failed to delete gist");
      console.error(error);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-card overflow-y-auto">
      {/* Navigation */}
      <div className="sticky top-0 z-50 mx-auto flex w-full max-w-screen-lg items-center justify-between p-6 py-3">
        <div className="flex h-10 items-center gap-1">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button size="sm" onClick={onGetStarted}>
            Get Started
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="z-10 mx-auto flex w-full max-w-screen-lg flex-col gap-4 px-6">
        {/* Hero */}
        <div className="z-10 flex h-full w-full flex-col items-center justify-center gap-4 p-12 md:p-16">
          <h1 className="text-center text-5xl font-bold leading-tight text-primary md:text-6xl lg:leading-tight">
            Markdown to Slides
            <br />
            <span className="text-primary/60">in Seconds</span>
          </h1>
          <p className="max-w-screen-md text-center text-lg !leading-normal text-muted-foreground md:text-xl">
            Transform your markdown into{" "}
            <span className="font-medium text-primary">
              beautiful presentations
            </span>
            . Simple, fast, and free.
          </p>
          <div className="mt-4 flex w-full items-center justify-center gap-3">
            <Button size="default" className="px-8" onClick={onGetStarted}>
              Create Your First Presentation
            </Button>
          </div>
        </div>

        {/* User's Gists */}
        {!loadingGists && userGists.length > 0 && (
          <div className="relative z-10 mb-8">
            <h2 className="text-center text-2xl font-bold text-primary mb-6">
              Your Presentations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGists.map((gist) => (
                <div
                  key={gist.id}
                  className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <h3 className="font-semibold text-primary truncate">
                        {gist.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteGist(gist.id, gist.title)}
                      className="text-destructive hover:text-destructive/80 transition p-1 shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Updated {new Date(gist.updatedAt).toLocaleDateString()}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenGist(gist.id)}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Demo */}
        <div className="relative z-10 mb-12">
          <h2 className="text-center text-2xl font-bold text-primary mb-6">
            See it in Action
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 border border-border rounded-xl overflow-hidden bg-card shadow-xl">
            {/* Markdown Side */}
            <div className="lg:w-1/2 bg-[#1e1e1e] p-6 font-mono text-sm text-green-400 overflow-auto max-h-[400px]">
              <div className="text-gray-500 mb-2">// Your markdown</div>
              <pre className="whitespace-pre-wrap">{DEMO_MARKDOWN}</pre>
            </div>

            {/* Preview Side */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
                <button
                  onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                  disabled={currentSlide === 0}
                  className="p-2 rounded-md hover:bg-card disabled:opacity-30 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  Slide {currentSlide + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
                  disabled={currentSlide >= slides.length - 1}
                  className="p-2 rounded-md hover:bg-card disabled:opacity-30 transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div
                id="demo-slide"
                className="flex-1 p-8 prose prose-sm dark:prose-invert max-w-none min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: slideHtml }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="z-10 flex w-full flex-col items-center justify-center gap-4 py-8">
        <p className="text-sm text-primary/40">
          © {new Date().getFullYear()} md2slides. All rights reserved.
        </p>
      </footer>

      <div className="base-grid fixed h-screen w-screen opacity-40" />
      <div className="fixed bottom-0 h-screen w-screen bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />
    </div>
  );
}
