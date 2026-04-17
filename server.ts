import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/tiktok-info", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      // 1. Resolve redirects for shortened links (vm.tiktok.com, vt.tiktok.com)
      const resolveResponse = await fetch(url as string, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      });
      
      const finalUrl = resolveResponse.url;
      console.log("Resolved TikTok URL:", finalUrl);

      // 2. Extract video ID from the final URL
      const videoIdMatch = finalUrl.match(/video\/(\d+)/) || finalUrl.match(/v\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      // 3. Get oembed info using the final URL
      const oembedResponse = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`
      );
      
      if (!oembedResponse.ok) {
        // Fallback if oembed fails but we have the ID
        if (videoId) {
          return res.json({ video_id: videoId, title: "TikTok Video", thumbnail_url: "" });
        }
        throw new Error("Failed to fetch TikTok oembed");
      }

      const data = await oembedResponse.json();
      res.json({
        ...data,
        video_id: videoId || data.video_id // Prefer extracted ID if available
      });
    } catch (error) {
      console.error("TikTok resolution error:", error);
      res.status(500).json({ error: "Failed to resolve TikTok URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
