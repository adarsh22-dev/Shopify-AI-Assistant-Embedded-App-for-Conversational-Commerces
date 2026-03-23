import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Use polling only — Vercel serverless doesn't support WebSocket upgrades
  transports: ["polling"],
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ─── Shopify API Helper ──────────────────────────────────────────────────────
const shopifyFetch = async (endpoint: string, method = "GET", body?: any) => {
  const shopName = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopName || !accessToken) {
    console.warn("Shopify credentials missing. Returning demo data.");

    if (endpoint.includes("products.json")) {
      return {
        products: [
          {
            id: "demo-1",
            title: "Premium Leather Backpack",
            variants: [{ price: "129.99" }],
            image: { src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" },
            product_type: "Accessories",
            inventory_quantity: 2,
            body_html: "Handcrafted from genuine top-grain leather, this backpack is perfect for daily commutes and weekend adventures.",
            images: [{ src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" }],
          },
          {
            id: "demo-2",
            title: "Minimalist Watch",
            variants: [{ price: "85.00" }],
            image: { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" },
            product_type: "Accessories",
            inventory_quantity: 5,
            body_html: "A sleek, timeless design that complements any outfit.",
            images: [{ src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" }],
          },
        ],
      };
    }

    if (endpoint.includes("products/") && endpoint.endsWith(".json")) {
      return {
        product: {
          id: "demo-1",
          title: "Premium Leather Backpack",
          variants: [{ price: "129.99" }],
          images: [{ src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" }],
          product_type: "Accessories",
          inventory_quantity: 2,
          body_html: "Handcrafted from genuine top-grain leather, this backpack is perfect for daily commutes and weekend adventures.",
        },
      };
    }

    if (endpoint.includes("policies.json")) {
      return {
        policies: [
          { title: "Refund Policy", body: "We offer a 30-day money-back guarantee on all products." },
          { title: "Shipping Policy", body: "Free worldwide shipping on orders over $100." },
        ],
      };
    }

    if (endpoint.includes("orders.json")) {
      return { orders: [] };
    }

    return { message: "Demo mode: Shopify not configured." };
  }

  const url = `https://${shopName}.myshopify.com/admin/api/2024-01/${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${errorText}`);
  }

  return response.json();
};

// ─── In-memory storage ───────────────────────────────────────────────────────
let faqs = [
  { id: "1", question: "What is your return policy?", answer: "We accept returns within 30 days of purchase. Items must be in original condition." },
  { id: "2", question: "How long does shipping take?", answer: "Shipping typically takes 3-5 business days for domestic orders." },
];

let analytics = {
  totalConversations: 0,
  totalMessages: 0,
  toolCalls: 0,
  leadsCaptured: 0,
  helpfulFeedback: 0,
  unhelpfulFeedback: 0,
  historicalData: [
    { date: "Mon", convs: 12, msgs: 45, leads: 2 },
    { date: "Tue", convs: 19, msgs: 72, leads: 5 },
    { date: "Wed", convs: 15, msgs: 58, leads: 3 },
    { date: "Thu", convs: 22, msgs: 89, leads: 7 },
    { date: "Fri", convs: 30, msgs: 124, leads: 12 },
    { date: "Sat", convs: 25, msgs: 98, leads: 8 },
    { date: "Sun", convs: 18, msgs: 65, leads: 4 },
  ],
};

let reviews: Record<string, { rating: number; comment: string; author: string; date: string }[]> = {
  "sample-id": [{ rating: 5, comment: "Great product!", author: "John D.", date: new Date().toISOString() }],
};

let wishlists: Record<string, any[]> = {};

let settings = {
  systemPrompt:
    "You are a helpful Shopify AI Assistant. Do not use emojis in your responses. You have access to tools to search products, get product details, track orders, get store policies, view cart, manage wishlist, and handle reviews.",
  welcomeMessage:
    "Hello! I'm your Shopify AI Assistant. I can help you find products, track orders, and answer questions. How can I help you today?",
  quickActionsEnabled: true,
  abandonmentNudgeEnabled: true,
  storeName: "Modern Store",
  storeDescription: "Your one-stop shop for premium accessories and minimalist designs.",
  supportEmail: "support@modernstore.com",
  primaryColor: "#008060",
  accentColor: "#000000",
  fontFamily: "Inter",
  chatPosition: "bottom-right",
};

let leads: { id: string; name: string; email: string; phone?: string; interest?: string; date: string }[] = [];
let chatLogs: { id: string; messages: any[]; date: string; userEmail?: string }[] = [];
let productAssignments: Record<string, string[]> = {
  Trending: ["demo-1"],
  "New Arrivals": ["demo-2"],
  "Best Sellers": ["demo-1", "demo-2"],
  Sale: [],
};
let trainingDocs: { id: string; title: string; content: string; date: string }[] = [];
let userProfiles: Record<string, any> = {};
let activeChats: Record<string, { id: string; messages: any[]; userEmail?: string; isHumanHandover: boolean; lastActivity: string }> = {};

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("send_message", (data) => {
    const { chatId, message } = data;
    if (!activeChats[chatId]) {
      activeChats[chatId] = { id: chatId, messages: [], isHumanHandover: false, lastActivity: new Date().toISOString() };
    }
    activeChats[chatId].messages.push(message);
    activeChats[chatId].lastActivity = new Date().toISOString();
    io.to(chatId).emit("receive_message", { ...message, chatId });
    io.emit("admin_new_message", { chatId, message });
  });

  socket.on("admin_reply", (data) => {
    const { chatId, message } = data;
    if (activeChats[chatId]) {
      activeChats[chatId].messages.push(message);
      activeChats[chatId].lastActivity = new Date().toISOString();
      io.to(chatId).emit("receive_message", { ...message, chatId });
    }
  });

  socket.on("request_handover", (chatId) => {
    if (activeChats[chatId]) {
      activeChats[chatId].isHumanHandover = true;
      io.to(chatId).emit("handover_status", true);
      io.emit("admin_handover_request", chatId);
    }
  });

  socket.on("admin_takeover", (chatId) => {
    if (activeChats[chatId]) {
      activeChats[chatId].isHumanHandover = true;
      io.to(chatId).emit("handover_status", true);
    }
  });

  socket.on("admin_release", (chatId) => {
    if (activeChats[chatId]) {
      activeChats[chatId].isHumanHandover = false;
      io.to(chatId).emit("handover_status", false);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ─── Admin auth helper ───────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const requireAdmin = (req: express.Request, res: express.Response): boolean => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
};

// ─── API Routes ──────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { contents, systemInstruction, tools, chatId } = req.body;

    if (chatId && activeChats[chatId]?.isHumanHandover) {
      return res.json({ skipAI: true, message: "Human agent is handling this conversation." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured on server." });

    const trainingContext = trainingDocs.map((d) => `[DOCUMENT: ${d.title}]\n${d.content}`).join("\n\n");
    const enhancedSystemInstruction = `${systemInstruction}\n\nAdditional Knowledge Base:\n${trainingContext}`;

    const ai = new GoogleGenAI({ apiKey });

    const callWithRetry = async (model: string, retries = 3): Promise<any> => {
      let lastErr: any;
      for (let i = 0; i < retries; i++) {
        try {
          return await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction: enhancedSystemInstruction, tools },
          });
        } catch (err: any) {
          lastErr = err;
          if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    };

    let model = "gemini-2.5-pro-preview-06-05";
    let response: any;
    try {
      response = await callWithRetry(model);
    } catch (error: any) {
      if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        model = "gemini-2.0-flash";
        response = await callWithRetry(model);
      } else {
        throw error;
      }
    }

    res.json(response);
  } catch (error: any) {
    console.error("Chat API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/policy", async (_req, res) => {
  try {
    const data = await shopifyFetch("policies.json");
    res.json(data.policies || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tracking", async (req, res) => {
  try {
    const { orderNumber, email } = req.body;
    const formattedOrderNumber = orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
    const data = await shopifyFetch(`orders.json?name=${encodeURIComponent(formattedOrderNumber)}&status=any`);
    let orders = data.orders || [];
    if (email) orders = orders.filter((o: any) => o.email?.toLowerCase() === email.toLowerCase());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/callback", (req, res) => {
  const { name, email, phone, interest } = req.body;
  const newLead = { id: Date.now().toString(), name, email, phone, interest, date: new Date().toISOString() };
  leads.push(newLead);
  analytics.leadsCaptured++;
  res.json({ success: true, lead: newLead });
});

app.get("/api/shopify/status", (_req, res) => {
  const isConfigured = !!(process.env.SHOPIFY_SHOP_NAME && process.env.SHOPIFY_ACCESS_TOKEN);
  res.json({ configured: isConfigured, shopName: process.env.SHOPIFY_SHOP_NAME });
});

app.get("/api/admin/training", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(trainingDocs);
});

app.post("/api/admin/training", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { title, content } = req.body;
  const newDoc = { id: Date.now().toString(), title, content, date: new Date().toISOString() };
  trainingDocs.push(newDoc);
  res.json(newDoc);
});

app.delete("/api/admin/training/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  trainingDocs = trainingDocs.filter((d) => d.id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/active-chats", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(Object.values(activeChats));
});

app.get("/api/settings", (_req, res) => {
  res.json({
    welcomeMessage: settings.welcomeMessage,
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
    supportEmail: settings.supportEmail,
    quickActionsEnabled: settings.quickActionsEnabled,
    abandonmentNudgeEnabled: settings.abandonmentNudgeEnabled,
  });
});

app.get("/api/admin/settings", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(settings);
});

app.post("/api/admin/settings", (req, res) => {
  if (!requireAdmin(req, res)) return;
  settings = { ...settings, ...req.body };
  res.json(settings);
});

app.get("/api/admin/leads", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(leads);
});

app.get("/api/admin/faqs", (_req, res) => res.json(faqs));

app.post("/api/admin/faqs", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { question, answer } = req.body;
  const newFaq = { id: Date.now().toString(), question, answer };
  faqs.push(newFaq);
  res.json(newFaq);
});

app.get("/api/admin/analytics", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(analytics);
});

app.get("/api/admin/logs", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(chatLogs);
});

app.get("/api/admin/assignments", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(productAssignments);
});

app.post("/api/admin/assignments", (req, res) => {
  if (!requireAdmin(req, res)) return;
  productAssignments = { ...productAssignments, ...req.body };
  res.json(productAssignments);
});

app.get("/api/user/profile", (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: "chatId is required" });
  const profile = userProfiles[chatId as string] || {
    name: "Guest",
    preferences: ["Minimalist", "Modern"],
    pastPurchases: ["Minimalist Watch"],
    lastViewed: ["Premium Leather Backpack"],
  };
  res.json(profile);
});

app.post("/api/user/profile", (req, res) => {
  const { chatId, profile } = req.body;
  if (!chatId) return res.status(400).json({ error: "chatId is required" });
  userProfiles[chatId] = { ...userProfiles[chatId], ...profile };
  res.json(userProfiles[chatId]);
});

app.post("/api/chat/logs", (req, res) => {
  const { chatId, messages, userEmail } = req.body;
  if (!chatId) return res.status(400).json({ error: "chatId is required" });
  const existingIndex = chatLogs.findIndex((log) => log.id === chatId);
  if (existingIndex !== -1) {
    chatLogs[existingIndex].messages = messages;
    chatLogs[existingIndex].userEmail = userEmail;
  } else {
    chatLogs.push({ id: chatId, messages, userEmail, date: new Date().toISOString() });
  }
  res.json({ success: true });
});

app.post("/api/feedback/:messageId", (req, res) => {
  const { messageId } = req.params;
  const { chatId, rating, comment } = req.body;
  if (!chatId || !messageId) return res.status(400).json({ error: "chatId and messageId are required" });

  const logIndex = chatLogs.findIndex((log) => log.id === chatId);
  if (logIndex !== -1) {
    chatLogs[logIndex].messages = chatLogs[logIndex].messages.map((m) =>
      m.id === messageId ? { ...m, feedback: { rating, comment } } : m
    );
  }
  if (activeChats[chatId]) {
    activeChats[chatId].messages = activeChats[chatId].messages.map((m) =>
      m.id === messageId ? { ...m, feedback: { rating, comment } } : m
    );
  }
  if (rating === "helpful") analytics.helpfulFeedback++;
  else if (rating === "unhelpful") analytics.unhelpfulFeedback++;
  res.json({ success: true });
});

app.post("/api/analytics/track", (req, res) => {
  const { type, data } = req.body;
  const today = analytics.historicalData.find((d) => d.date === "Fri");
  if (type === "conversation") { analytics.totalConversations++; if (today) today.convs++; }
  if (type === "message") { analytics.totalMessages++; if (today) today.msgs++; }
  if (type === "toolCall") analytics.toolCalls++;
  if (type === "lead") {
    analytics.leadsCaptured++;
    if (today) today.leads++;
    if (data) leads.push({ id: Date.now().toString(), ...data, date: new Date().toISOString() });
  }
  res.json({ success: true });
});

app.get("/api/reviews/:productId", (req, res) => {
  res.json(reviews[req.params.productId] || []);
});

app.post("/api/reviews/:productId", (req, res) => {
  const { productId } = req.params;
  const { rating, comment, author } = req.body;
  if (!reviews[productId]) reviews[productId] = [];
  const newReview = { rating, comment, author, date: new Date().toISOString() };
  reviews[productId].push(newReview);
  res.json(newReview);
});

app.get("/api/wishlist", (_req, res) => res.json(wishlists["default"] || []));

app.post("/api/wishlist", (req, res) => {
  const { product } = req.body;
  if (!wishlists["default"]) wishlists["default"] = [];
  if (!wishlists["default"].find((p) => p.id === product.id)) wishlists["default"].push(product);
  res.json(wishlists["default"]);
});

app.delete("/api/wishlist/:productId", (req, res) => {
  const { productId } = req.params;
  if (wishlists["default"]) wishlists["default"] = wishlists["default"].filter((p) => p.id.toString() !== productId);
  res.json(wishlists["default"]);
});

app.post("/api/shopify/proxy", async (req, res) => {
  try {
    const { endpoint, method, body } = req.body;
    const data = await shopifyFetch(endpoint, method, body);
    res.json(data);
  } catch (error: any) {
    console.error("Shopify Proxy Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Static file serving (production) ───────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ─── Local dev server ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev server running on http://localhost:${PORT}`);
  });
}

export default httpServer;
