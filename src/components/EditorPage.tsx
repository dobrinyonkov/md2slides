import { useState, useEffect, useCallback } from "react";
import { MarkdownEditor } from "./MarkdownEditor";
import { SlidePreview } from "./SlidePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Save, Presentation, ArrowLeft, Check, Download, Upload, Share2, X, Copy } from "lucide-react";

const DEFAULT_CONTENT = `# Welcome to md2slides 🎉

Transform your markdown into beautiful presentations

Press **Present** to start →

# Getting Started

Just write markdown and watch it become slides

- Each \`# heading\` or \`## heading\` creates a new slide
- Use **bold**, *italic*, and \`code\` for emphasis
- Add lists, links, and more!

# Features You'll Love

## Simple
No complex tools. Just markdown.

## Fast
Real-time preview as you type

## Beautiful
Clean, professional slides

# Code Blocks Supported

\`\`\`javascript
function hello() {
  console.log("Hello, md2slides!");
}
\`\`\`

Syntax highlighting included!

# Your Turn

1. Clear this demo with the **Clear** button
2. Start typing your content
3. Click **Share** to publish to GitHub Gist
4. Present and impress! 🚀

# Pro Tips

- Press **← →** or **Space** to navigate slides in present mode
- Press **Esc** to exit presentation
- Your work auto-saves locally
- Share creates a link anyone can view

# Ready?

Start creating your presentation now!

*Happy presenting!* ✨
`;

interface EditorPageProps {
  onBack: () => void;
  onPresent: (content: string) => void;
  gistId?: string;
}

export function EditorPage({ onBack, onPresent, gistId }: EditorPageProps) {
  const [content, setContent] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("md2slides-content") || DEFAULT_CONTENT;
    }
    return DEFAULT_CONTENT;
  });

  const [title, setTitle] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("md2slides-title") || "My Presentation";
    }
    return "My Presentation";
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentGistId, setCurrentGistId] = useState<string | null>(null);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  // Load from gist if gistId provided
  useEffect(() => {
    if (gistId && !isLoadingGist) {
      setIsLoadingGist(true);
      Promise.all([
        fetch(`/api/gist/load/${gistId}`).then(res => res.json()),
        fetch(`/api/gist/check-ownership/${gistId}`).then(res => res.json())
      ])
        .then(([data, ownership]) => {
          if (data.content) {
            setContent(data.content);
            setTitle(data.title || "Loaded from Gist");
            // Only set currentGistId if user owns it (can edit)
            setCurrentGistId(ownership.owned ? gistId : null);
          }
        })
        .catch((error) => {
          console.error("Failed to load gist:", error);
          alert("Failed to load presentation from Gist");
        })
        .finally(() => setIsLoadingGist(false));
    }
  }, [gistId]);

  // Auto-save to localStorage and gist (if owned)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Always save to localStorage
      localStorage.setItem("md2slides-content", content);
      localStorage.setItem("md2slides-title", title);
      setLastSaved(new Date());

      // If user owns the gist, auto-save to gist too
      if (currentGistId) {
        try {
          await fetch("/api/gist/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              title, 
              content,
              gistId: currentGistId
            }),
            credentials: "same-origin"
          });
        } catch (error) {
          console.error("Auto-save to gist failed:", error);
        }
      }
    }, 2000); // 2 seconds debounce
    return () => clearTimeout(timer);
  }, [content, title, currentGistId]);

  const handlePresent = () => {
    onPresent(content);
  };

  const handleShare = async () => {
    // If already has gistId, just show the modal
    if (currentGistId) {
      const shareUrl = `${window.location.origin}/#/editor?gist=${currentGistId}`;
      setPublishedUrl(shareUrl);
      setShowPublishModal(true);
      return;
    }

    // Otherwise, publish to gist first
    try {
      const response = await fetch("/api/gist/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          content,
          gistId: currentGistId
        }),
        credentials: "same-origin"
      });
      const data = await response.json();
      if (data.id) {
        setCurrentGistId(data.id);
        const shareUrl = `${window.location.origin}/#/editor?gist=${data.id}`;
        setPublishedUrl(shareUrl);
        setShowPublishModal(true);
        // Update URL to include gist ID
        window.location.hash = `/editor?gist=${data.id}`;
      }
    } catch (error) {
      alert("Failed to publish to Gist");
      console.error(error);
    }
  };

  const handleClear = () => {
    if (confirm("Clear editor? This will delete all content.")) {
      setContent("# New Presentation\n\nStart typing...");
      setTitle("My Presentation");
      setCurrentGistId(null);
      window.location.hash = "/editor";
    }
  };

  const handleCopyPublishedUrl = () => {
    navigator.clipboard.writeText(publishedUrl);
  };

  return (
    <div className="flex h-screen flex-col bg-secondary dark:bg-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border bg-card gap-2">
        {/* Top row on mobile, left side on desktop */}
        <div className="flex items-center justify-between px-2 py-2 md:px-4 md:py-3 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-32 md:w-64"
              placeholder="Title"
            />
          </div>

          {/* Mobile View Toggle */}
          <div className="flex items-center gap-1 md:hidden bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              variant={activeTab === "editor" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab("editor")}
            >
              Editor
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </Button>
          </div>
        </div>

        {/* Bottom row on mobile, right side on desktop */}
        <div className="flex items-center justify-between px-2 pb-2 md:px-4 md:py-3 gap-2">
          {lastSaved && (
            <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <div className="flex items-center gap-1 md:gap-2 flex-1 md:flex-initial justify-end">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="px-2 md:px-3"
              onClick={handleClear}
              title="Clear"
            >
              <X className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Clear</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2 md:px-3"
              onClick={handleShare}
              title="Share"
            >
              <Share2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Share</span>
            </Button>
            <Button 
              size="sm" 
              className="px-2 md:px-3" 
              onClick={handlePresent}
              title="Present"
            >
              <Presentation className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Present</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Publish Success Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">
                {currentGistId ? "Share Presentation" : "Published Successfully!"}
              </h2>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-muted-foreground hover:text-primary transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your presentation has been published to GitHub Gist. Share this URL:
            </p>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-md mb-4">
              <input
                type="text"
                value={publishedUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none text-primary"
              />
              <button
                onClick={handleCopyPublishedUrl}
                className="p-2 hover:bg-card rounded transition"
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="w-full"
              onClick={() => setShowPublishModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile View */}
        <div className="flex-1 overflow-hidden md:hidden">
          {activeTab === "editor" ? (
            <MarkdownEditor value={content} onChange={setContent} />
          ) : (
            <SlidePreview
              content={content}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex flex-1">
          <div className="w-1/2 border-r border-border">
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
          <div className="w-1/2">
            <SlidePreview
              content={content}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
