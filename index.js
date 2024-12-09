import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001; // You can set any port

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://alydvisuals.com",
  "https://alydvisuals.com",
  "https://effortless-gaufre-8d0eb6.netlify.app/",
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Endpoint to fetch Instagram media
app.get("/api/instagram", async (req, res) => {
  try {
    const accessToken = process.env.IG_ACCESS_TOKEN;
    const instaUrl = `https://graph.instagram.com/me/media?access_token=${accessToken}`;

    const response = await fetch(instaUrl);
    const json = await response.json();
    const mediaItems = [];

    // Fetch additional details for each media item
    const fetchMediaDetails = async (id) => {
      const mediaUrl = `https://graph.instagram.com/${id}?access_token=${accessToken}&fields=media_url,permalink,media_type,children`;
      const res = await fetch(mediaUrl);
      return res.json();
    };

    for (let i = 0; i < json.data.length; i++) {
      const item = json.data[i];
      const details = await fetchMediaDetails(item.id);

      if (details.media_type === "IMAGE") {
        mediaItems.push({ type: "image", url: details.media_url });
      } else if (details.media_type === "VIDEO") {
        mediaItems.push({ type: "video", url: details.media_url });
      } else if (details.media_type === "CAROUSEL_ALBUM") {
        const carouselUrls = await Promise.all(
          details.children.data.map(async (child) => {
            const childDetails = await fetchMediaDetails(child.id);
            return childDetails.media_url;
          })
        );
        mediaItems.push({
          type: "carousel",
          carousel: carouselUrls,
        });
      }
    }

    res.json(mediaItems); // Send media data to frontend
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    res.status(500).json({ error: "Failed to fetch Instagram data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
