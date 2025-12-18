import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { EditorPage } from "./components/EditorPage";
import { PresentPage } from "./components/PresentPage";
import "./index.css";

type View = "landing" | "editor" | "present";

function getUrlParams() {
  const hash = window.location.hash.slice(1); // Remove #
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query);
  return { path, params };
}

export function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [presentationContent, setPresentationContent] = useState("");
  const [gistId, setGistId] = useState<string | undefined>();

  // Handle routing
  useEffect(() => {
    const handleHashChange = () => {
      const { path, params } = getUrlParams();
      const gistParam = params.get("gist");
      
      if (path === "/editor") {
        setCurrentView("editor");
        setGistId(gistParam || undefined);
      } else if (path === "/present") {
        setCurrentView("present");
        setGistId(gistParam || undefined);
      } else {
        setCurrentView("landing");
        setGistId(undefined);
      }
    };

    // Initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleGetStarted = () => {
    window.location.hash = "/editor";
  };

  const handleBack = () => {
    window.location.hash = "/";
  };

  const handlePresent = (content: string) => {
    setPresentationContent(content);
    const { params } = getUrlParams();
    const gistParam = params.get("gist");
    if (gistParam) {
      window.location.hash = `/present?gist=${gistParam}`;
    } else {
      window.location.hash = "/present";
    }
  };

  const handleExitPresent = () => {
    const { params } = getUrlParams();
    const gistParam = params.get("gist");
    if (gistParam) {
      window.location.hash = `/editor?gist=${gistParam}`;
    } else {
      window.location.hash = "/editor";
    }
  };

  return (
    <div className={currentView === "landing" ? "min-h-screen w-screen" : "h-screen w-screen overflow-hidden"}>
      {currentView === "landing" && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      {currentView === "editor" && (
        <EditorPage onBack={handleBack} onPresent={handlePresent} gistId={gistId} />
      )}
      {currentView === "present" && (
        <PresentPage content={presentationContent} onExit={handleExitPresent} gistId={gistId} />
      )}
    </div>
  );
}

export default App;
