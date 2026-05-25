import { useState, useEffect } from "react";
import { ProjectsView } from "@/features/projects/components/projects-view";
import ProjectIdPage from "@/app/projects/[projectid]/page";
import "./App.css";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    // Also listen for custom navigation events
    window.addEventListener("pushstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate", handleLocationChange);
    };
  }, []);

  if (path.startsWith("/projects/")) {
    const projectId = path.split("/")[2];
    if (projectId) {
      return (
        <main>
          <ProjectIdPage projectId={projectId} />
        </main>
      );
    }
  }

  return (
    <main>
        <ProjectsView />
    </main>
  );
}

export default App;
