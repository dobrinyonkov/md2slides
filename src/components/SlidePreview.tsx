import { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

interface SlidePreviewProps {
  content: string;
  currentSlide: number;
  onSlideChange?: (index: number) => void;
  className?: string;
  compact?: boolean;
}

function parseSlides(text: string): string[] {
  if (!text.trim()) return ["# Welcome\n\nNo content to display"];
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

  return slides.length > 0 ? slides : ["# Welcome\n\nNo content to display"];
}

export function SlidePreview({
  content,
  currentSlide,
  onSlideChange,
  className = "",
  compact = false,
}: SlidePreviewProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const slides = parseSlides(content);
  const safeSlideIndex = Math.min(currentSlide, slides.length - 1);

  useEffect(() => {
    if (slideRef.current) {
      slideRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content, safeSlideIndex]);

  const handlePrev = () => {
    if (safeSlideIndex > 0 && onSlideChange) {
      onSlideChange(safeSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (safeSlideIndex < slides.length - 1 && onSlideChange) {
      onSlideChange(safeSlideIndex + 1);
    }
  };

  const htmlContent = marked.parse(slides[safeSlideIndex] || "") as string;

  return (
    <div className={`flex flex-col h-full ${className} ${compact ? "overflow-hidden" : ""}`}>
      {/* Controls - Hide in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <button
            onClick={handlePrev}
            disabled={safeSlideIndex === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {safeSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={handleNext}
            disabled={safeSlideIndex >= slides.length - 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Slide Content */}
      <div className={`flex-1 overflow-auto bg-card ${compact ? "flex items-center justify-center p-4" : "p-6"}`}>
        <div
          ref={slideRef}
          className={`prose prose-neutral dark:prose-invert max-w-none ${compact ? "prose-xl text-center" : ""}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

export function useSlides(content: string) {
  return parseSlides(content);
}
