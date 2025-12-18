import { useState, useEffect } from "react";
import { useSlides } from "./SlidePreview";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { marked } from "marked";
import hljs from "highlight.js";

interface PresentPageProps {
  content: string;
  onExit: () => void;
  gistId?: string;
}

export function PresentPage({ content: initialContent, onExit, gistId }: PresentPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [content, setContent] = useState(initialContent);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const slides = useSlides(content);

  // Load from gist if gistId provided
  useEffect(() => {
    if (gistId && !isLoadingGist) {
      setIsLoadingGist(true);
      fetch(`/api/gist/load/${gistId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.content) {
            setContent(data.content);
          }
        })
        .catch((error) => {
          console.error("Failed to load gist:", error);
        })
        .finally(() => setIsLoadingGist(false));
    }
  }, [gistId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, onExit]);

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [currentSlide]);

  const safeSlideIndex = Math.min(currentSlide, slides.length - 1);
  const slideContent = slides[safeSlideIndex] || "";
  const htmlContent = marked.parse(slideContent) as string;

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto">
        <div
          className="prose prose-lg dark:prose-invert max-w-4xl w-full animate-in fade-in slide-in-from-right-4 duration-300"
          style={{ animationDelay: "0ms" }}
          key={safeSlideIndex}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-12 py-6 border-t border-border bg-card">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={safeSlideIndex === 0}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Previous
        </button>

        <span className="text-lg font-bold text-primary">
          {safeSlideIndex + 1} / {slides.length}
        </span>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
          disabled={safeSlideIndex >= slides.length - 1}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition flex items-center gap-2"
        >
          Next
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
