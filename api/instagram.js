import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// CORS allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://alydvisuals.com",
  "https://alydvisuals.com",
  "https://effortless-gaufre-8d0eb6.netlify.app",
];

// Serverless function handler
export default async function handler(req, res) {
  try {
    const origin = req.headers.origin;

    // Add CORS headers
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "null"); // Fallback for unknown origins
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // Ensure access token is available
    const accessToken = process.env.IG_ACCESS_TOKEN;
    if (!accessToken) {
      res.status(500).json({ error: "Missing Instagram access token" });
      return;
    }

    // Fetch Instagram data
    const instaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,children&access_token=${accessToken}`;
    const response = await fetch(instaUrl);
    if (!response.ok) {
      throw new Error(`Instagram API returned status ${response.status}`);
    }

    const data = await response.json();

    // Process media items
    const mediaItems = data.data
      .map((item) => {
        const {
          media_type,
          media_url,
          permalink,
          caption,
          thumbnail_url,
          children,
        } = item;
        console.log(item);
        if (media_type === "IMAGE") {
          return { type: "image", url: media_url, caption, permalink };
        } else if (media_type === "VIDEO") {
          return { type: "video", url: media_url, caption, permalink };
        } else if (media_type === "CAROUSEL_ALBUM") {
          return {
            type: "carousel",
            children,
            caption,
            permalink,
            url: media_url,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.status(200).json(mediaItems);
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    res.status(500).json({ error: "Failed to fetch Instagram data" });
  }
}
