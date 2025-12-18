import { serve } from "bun";
import index from "./index.html";

// GitHub Personal Access Token - set this in your environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

const server = serve({
  routes: {
    // GitHub Gist API endpoints
    "/api/gist/save": {
      async POST(req) {
        if (!GITHUB_TOKEN) {
          return Response.json(
            { error: "GitHub token not configured" },
            { status: 500 }
          );
        }

        try {
          const { title, content, gistId } = await req.json();

          const gistData = {
            description: title || "md2slides presentation",
            public: false,
            files: {
              "presentation.md": {
                content: content,
              },
              "metadata.json": {
                content: JSON.stringify({ 
                  title, 
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }),
              },
            },
          };

          let response;
          let finalGistId = gistId;

          if (gistId) {
            // Try to update existing gist
            response = await fetch(`https://api.github.com/gists/${gistId}`, {
              method: "PATCH",
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
                "User-Agent": "md2slides",
              },
              body: JSON.stringify(gistData),
            });

            // If update fails (not owner or gist deleted), create new
            if (!response.ok) {
              console.log("Update failed, creating new gist");
              response = await fetch("https://api.github.com/gists", {
                method: "POST",
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`,
                  "Content-Type": "application/json",
                  "User-Agent": "md2slides",
                },
                body: JSON.stringify(gistData),
              });
              finalGistId = null; // Will get new ID from response
            }
          } else {
            // Create new gist
            response = await fetch("https://api.github.com/gists", {
              method: "POST",
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
                "User-Agent": "md2slides",
              },
              body: JSON.stringify(gistData),
            });
          }

          if (!response.ok) {
            const error = await response.text();
            console.error("GitHub API error:", error);
            return Response.json(
              { error: "Failed to save gist" },
              { status: response.status }
            );
          }

          const result = await response.json();
          const resultId = finalGistId || result.id;

          // Set cookie to track owned gists
          const headers = new Headers();
          headers.set("Content-Type", "application/json");
          
          // Get existing owned gists from cookie
          const cookieHeader = req.headers.get("cookie") || "";
          const cookies = Object.fromEntries(
            cookieHeader.split(";").map(c => {
              const [key, ...v] = c.trim().split("=");
              return [key, v.join("=")];
            }).filter(([k]) => k)
          );
          
          const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
          if (!ownedGists.includes(resultId)) {
            ownedGists.push(resultId);
          }
          
          // Set cookie (expires in 1 year)
          headers.set(
            "Set-Cookie",
            `md2slides_owned=${encodeURIComponent(JSON.stringify(ownedGists))}; Path=/; Max-Age=31536000; SameSite=Lax`
          );

          return new Response(
            JSON.stringify({
              url: result.html_url,
              id: resultId,
              updated: !!finalGistId,
            }),
            { headers }
          );
        } catch (error) {
          console.error("Error saving to gist:", error);
          return Response.json(
            { error: "Failed to save to gist" },
            { status: 500 }
          );
        }
      },
    },

    "/api/gist/list": async (req) => {
      if (!GITHUB_TOKEN) {
        return Response.json({ gists: [] });
      }

      try {
        const cookieHeader = req.headers.get("cookie") || "";
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map(c => {
            const [key, ...v] = c.trim().split("=");
            return [key, v.join("=")];
          }).filter(([k]) => k)
        );
        
        const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
        
        if (ownedGists.length === 0) {
          return Response.json({ gists: [] });
        }

        // Fetch metadata for each owned gist
        const gistPromises = ownedGists.map(async (gistId: string) => {
          try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "User-Agent": "md2slides",
              },
            });
            
            if (!response.ok) return null;
            
            const gist = await response.json();
            let title = "Untitled Presentation";
            
            if (gist.files["metadata.json"]) {
              try {
                const metadata = JSON.parse(gist.files["metadata.json"].content);
                title = metadata.title || title;
              } catch (e) {
                // Ignore parsing errors
              }
            }
            
            return {
              id: gist.id,
              title,
              description: gist.description,
              updatedAt: gist.updated_at,
              url: gist.html_url,
            };
          } catch (error) {
            return null;
          }
        });
        
        const gists = (await Promise.all(gistPromises)).filter(g => g !== null);
        return Response.json({ gists });
      } catch (error) {
        console.error("Error listing gists:", error);
        return Response.json({ gists: [] });
      }
    },

    "/api/gist/delete/:id": {
      async DELETE(req) {
        if (!GITHUB_TOKEN) {
          return Response.json(
            { error: "GitHub token not configured" },
            { status: 500 }
          );
        }

        try {
          const gistId = req.params.id;
          
          // Delete from GitHub
          const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: "DELETE",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              "User-Agent": "md2slides",
            },
          });

          if (!response.ok && response.status !== 404) {
            return Response.json(
              { error: "Failed to delete gist" },
              { status: response.status }
            );
          }

          // Remove from cookie
          const cookieHeader = req.headers.get("cookie") || "";
          const cookies = Object.fromEntries(
            cookieHeader.split(";").map(c => {
              const [key, ...v] = c.trim().split("=");
              return [key, v.join("=")];
            }).filter(([k]) => k)
          );
          
          const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
          const updatedGists = ownedGists.filter((id: string) => id !== gistId);
          
          const headers = new Headers();
          headers.set("Content-Type", "application/json");
          headers.set(
            "Set-Cookie",
            `md2slides_owned=${encodeURIComponent(JSON.stringify(updatedGists))}; Path=/; Max-Age=31536000; SameSite=Lax`
          );

          return new Response(
            JSON.stringify({ success: true }),
            { headers }
          );
        } catch (error) {
          console.error("Error deleting gist:", error);
          return Response.json(
            { error: "Failed to delete gist" },
            { status: 500 }
          );
        }
      },
    },

    "/api/gist/check-ownership/:id": async (req) => {
      try {
        const gistId = req.params.id;
        const cookieHeader = req.headers.get("cookie") || "";
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map(c => {
            const [key, ...v] = c.trim().split("=");
            return [key, v.join("=")];
          }).filter(([k]) => k)
        );
        
        const ownedGists = cookies.md2slides_owned ? JSON.parse(decodeURIComponent(cookies.md2slides_owned)) : [];
        const isOwned = ownedGists.includes(gistId);
        
        return Response.json({ owned: isOwned });
      } catch (error) {
        return Response.json({ owned: false });
      }
    },

    "/api/gist/load/:id": async (req) => {
      if (!GITHUB_TOKEN) {
        return Response.json(
          { error: "GitHub token not configured" },
          { status: 500 }
        );
      }

      try {
        const gistId = req.params.id;
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": "md2slides",
          },
        });

        if (!response.ok) {
          return Response.json(
            { error: "Gist not found" },
            { status: response.status }
          );
        }

        const gist = await response.json();
        const content = gist.files["presentation.md"]?.content || "";
        let title = "Untitled Presentation";

        if (gist.files["metadata.json"]) {
          try {
            const metadata = JSON.parse(gist.files["metadata.json"].content);
            title = metadata.title || title;
          } catch (e) {
            // Ignore metadata parsing errors
          }
        }

        return Response.json({ content, title });
      } catch (error) {
        console.error("Error loading from gist:", error);
        return Response.json(
          { error: "Failed to load from gist" },
          { status: 500 }
        );
      }
    },

    // Serve index.html for all unmatched routes
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
if (!GITHUB_TOKEN) {
  console.warn("⚠️  GITHUB_TOKEN not set - Gist features will not work");
  console.warn("   Set GITHUB_TOKEN environment variable to enable Gist save/load");
}
