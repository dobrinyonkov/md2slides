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
    <div className="relative flex min-h-screen w-full flex-col bg-background overflow-y-auto">
      {/* Navigation */}
      <div className="sticky top-0 z-50 mx-auto flex w-full max-w-screen-lg items-center justify-between p-6 py-3">
        <div className="flex h-10 items-center gap-1">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/dobrinyonkov/md2slides"
            target="_blank"
            rel="noreferrer"
            className="group flex gap-2 items-center text-primary/80 hover:text-primary transition"
            title="Star us on GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="hidden md:inline text-sm font-medium">Star on GitHub</span>
          </a>
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
                  className="border border-border rounded-lg p-4 backdrop-blur-sm hover:border-primary/50 transition-colors"
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

        {/* Feature Cards */}
        <div className="relative z-10 flex flex-col border border-border backdrop-blur-sm lg:flex-row mb-12">
          <div className="flex w-full flex-col items-start justify-center gap-6 border-r border-border p-10 lg:p-12">
            <p className="h-14 text-lg text-primary/60">
              <span className="font-semibold text-primary">
                Simple. Fast. Beautiful.
              </span>{" "}
              Transform markdown into slides without the complexity of traditional tools.
            </p>
            <Button size="sm" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
          <div className="flex w-full flex-col items-start justify-center gap-6 p-10 lg:w-[60%] lg:p-12">
            <p className="h-14 text-lg text-primary/60">
              <span className="font-semibold text-primary">Free.</span>{" "}
              No accounts. Create presentations with GitHub Gists.
            </p>
            <a
              href="https://github.com/dobrinyonkov/md2slides"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              View on GitHub
            </a>
          </div>

          <div className="absolute left-0 top-0 z-10 flex flex-col items-center justify-center">
            <span className="absolute h-6 w-[1px] bg-primary/40" />
            <span className="absolute h-[1px] w-6 bg-primary/40" />
          </div>
          <div className="absolute bottom-0 right-0 z-10 flex flex-col items-center justify-center">
            <span className="absolute h-6 w-[1px] bg-primary/40" />
            <span className="absolute h-[1px] w-6 bg-primary/40" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 flex w-full flex-col items-center justify-center gap-4 py-8">
        <p className="text-sm text-primary/40">
          © {new Date().getFullYear()} md2slides. All rights reserved.
        </p>
      </footer>

      {/* Background Effects */}
      <div
        className="background-effect fixed left-0 top-0 z-0 h-full w-full opacity-60 pointer-events-none dark:invert"
      />
      <div className="base-grid fixed h-screen w-screen z-0 opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 h-screen w-screen z-0 bg-gradient-to-t from-[hsl(var(--background))] to-transparent pointer-events-none" />
    </div>
  );
}
