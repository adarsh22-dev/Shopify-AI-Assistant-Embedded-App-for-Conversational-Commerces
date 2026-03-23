import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  ShoppingBag, 
  Search,
  Package,
  Star,
  MessageSquare,
  Sun,
  Moon,
  Zap,
  ArrowRight,
  Phone,
  Check,
  Loader2,
  Users,
  Megaphone,
  FileText,
  Lock,
  Shield,
  AlertCircle
} from "lucide-react";
import { AppProvider, Page, Layout, Frame, TopBar, Navigation, Box, Text, BlockStack, Modal, FormLayout, TextField, Button, Card, Divider, Icon } from "@shopify/polaris";
import { 
  HomeIcon, 
  ChartVerticalIcon, 
  QuestionCircleIcon, 
  ExitIcon, 
  SettingsIcon, 
  PersonIcon, 
  ChatIcon, 
  ProductIcon, 
  TextIcon, 
  CodeIcon,
  MagicIcon,
  OrderIcon,
  AutomationIcon,
  MegaphoneIcon,
  TeamIcon,
  ConnectIcon,
  NotificationIcon,
  FileIcon
} from "@shopify/polaris-icons";

import { shopifyTools, handleShopifyFunctionCall } from "./services/shopifyService";
import { Toaster, toast } from "react-hot-toast";
import { ChatPopup } from "./components/ChatPopup";
import { AdminDashboard } from "./components/AdminDashboard";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  products?: any[];
  orderHistory?: any[];
  hidden?: boolean;
  feedback?: {
    rating: "helpful" | "unhelpful";
    comment?: string;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "admin" | "analytics" | "wishlist" | "settings" | "leads" | "cart" | "logs" | "assignments" | "live" | "training" | "installation" | "insights" | "customers" | "orders" | "config" | "automation" | "campaigns" | "team" | "integrations" | "notifications" | "system_logs">("chat");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content: "Hello! I'm your Shopify AI Assistant. I can help you find products, track orders, and answer questions. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [shopName, setShopName] = useState("");
  const [faqs, setFaqs] = useState<{id: string, question: string, answer: string}[]>([]);
  const [policies, setPolicies] = useState<{title: string, body: string}[]>([]);
  const [settings, setSettings] = useState<any>({ 
    systemPrompt: "", 
    welcomeMessage: "",
    quickActionsEnabled: true,
    abandonmentNudgeEnabled: true
  });
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, toolCalls: 0, leadsCaptured: 0, helpfulFeedback: 0, unhelpfulFeedback: 0 });
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("admin_password") || "");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isHumanHandover, setIsHumanHandover] = useState(false);
  const [cart, setCart] = useState<{items: any[], total: number, discount?: { code: string, amount: number }}>({ items: [], total: 0 });
  const [abandonmentTimer, setAbandonmentTimer] = useState<NodeJS.Timeout | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ orderNumber: string, email: string }>({ orderNumber: "", email: "" });
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [callbackInfo, setCallbackInfo] = useState({ name: "", phone: "", email: "", interest: "" });
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [isFetchingTrending, setIsFetchingTrending] = useState(false);
  const [userProfile, setUserProfile] = useState({
    preferences: [] as string[],
    pastPurchases: [] as string[],
    lastViewed: [] as string[],
    name: ""
  });
  const [chatId] = useState(() => {
    const savedId = localStorage.getItem("chat_id");
    if (savedId) return savedId;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem("chat_id", newId);
    return newId;
  });
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isAdminMode, setIsAdminMode] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("admin") === "1";
  });

  const handleAdminLogin = async (silent = false) => {
    if (!adminPassword) {
      if (!silent) toast.error("Please enter the admin password.");
      return false;
    }
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: { "x-admin-key": adminPassword }
      });
      if (response.ok) {
        setIsAdminAuthenticated(true);
        localStorage.setItem("admin_password", adminPassword);
        fetchAnalytics();
        if (!silent) toast.success("Admin authenticated successfully");
        return true;
      } else {
        if (!silent) toast.error("Incorrect admin password. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Admin login failed", error);
      if (!silent) toast.error("An error occurred during login.");
      return false;
    }
  };

  useEffect(() => {
    checkConfig();
    fetchFaqs();
    fetchPolicies();
    fetchSettings();
    fetchTrendingProducts();
    if (isAdminMode && adminPassword) fetchAnalytics();
    fetchWishlist();
    fetchUserProfile();

    if (adminPassword) {
      handleAdminLogin(true);
    }

    // Setup Socket
    const socket = io({ transports: ["polling"] });
    socketRef.current = socket;

    socket.emit("join_chat", chatId);

    socket.on("receive_message", (data) => {
      // Data is now { ...message, chatId }
      const { chatId: msgChatId, ...message } = data;
      
      // Only handle if it's for this chat
      if (msgChatId !== chatId) return;

      // If it's from model and isHuman, it's an admin reply
      if (message.role === "model" && message.isHuman) {
        setMessages(prev => {
          // Avoid duplicates if already added locally (unlikely for admin replies)
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message as Message];
        });
      }
    });

    socket.on("handover_status", (status) => {
      setIsEscalated(status);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdminAuthenticated, isAdminMode, chatId]);

  useEffect(() => {
    // Cart Abandonment Detection
    if (settings.abandonmentNudgeEnabled && cart.items.length > 0 && !isChatOpen) {
      if (abandonmentTimer) clearTimeout(abandonmentTimer);
      
      const timer = setTimeout(() => {
        // Trigger nudge
        const nudgeMessage: Message = {
          id: "nudge-" + Date.now(),
          role: "model",
          content: `Hi there! I noticed you have some great items in your cart. 
          
Don't miss out! Use code **SAVE10** for an extra 10% off your order right now. 
          
Would you like me to help you complete your checkout?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, nudgeMessage]);
        setIsChatOpen(true);
        trackEvent("abandonment_nudge");
      }, 60000); // 1 minute of inactivity with items in cart
      
      setAbandonmentTimer(timer);
    }

    return () => {
      if (abandonmentTimer) clearTimeout(abandonmentTimer);
    };
  }, [cart, isChatOpen, settings.abandonmentNudgeEnabled]);

  const trackProductView = (product: any) => {
    setUserProfile(prev => ({
      ...prev,
      lastViewed: Array.from(new Set([product.title, ...prev.lastViewed])).slice(0, 5),
      preferences: Array.from(new Set([...prev.preferences, ...product.title.split(' ').filter((w: string) => w.length > 3)]))
    }));
  };

  useEffect(() => {
    if (cart.items.length > 0 && !isChatOpen && settings.abandonmentNudgeEnabled) {
      const timer = setTimeout(() => {
        // Trigger abandonment nudge
        const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const hasHighValue = cartTotal > 200;
        
        const nudgeMessage: Message = {
          id: "abandonment-nudge",
          role: "model",
          content: hasHighValue 
            ? `I noticed you have some amazing items worth $${cartTotal.toFixed(2)} in your cart! To help you complete your order, I've unlocked a special VIP discount for you. Use code **SAVE15** for 15% off! Plus, these items are selling fast - only a few left in stock!`
            : "I noticed you have some great items in your cart! Would you like a 10% discount to complete your purchase today? Use code: **SAVE10**. Don't wait too long, our stock is limited!",
          timestamp: new Date(),
          hidden: false
        };
        
        setMessages(prev => {
          if (prev.some(m => m.id === "abandonment-nudge")) return prev;
          return [...prev, nudgeMessage];
        });
        setIsChatOpen(true);
      }, 30000); // 30 seconds of abandonment
      setAbandonmentTimer(timer);
    } else {
      if (abandonmentTimer) clearTimeout(abandonmentTimer);
    }
    return () => { if (abandonmentTimer) clearTimeout(abandonmentTimer); };
  }, [cart.items.length, isChatOpen]);

  useEffect(() => {
    fetchTrendingProducts();
  }, [isConfigured]);

  const fetchTrendingProducts = async () => {
    setIsFetchingTrending(true);
    try {
      const response = await fetch("/api/shopify/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "products.json?limit=4", method: "GET" }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      if (data && data.products) {
        setTrendingProducts(data.products.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.variants?.[0]?.price || "0.00",
          image: p.images?.[0]?.src || p.image?.src || "https://picsum.photos/seed/product/400/400",
          rating: 4.5 + Math.random() * 0.5
        })));
      } else {
        // Fallback to demo defaults if proxy fails or returns empty
        setTrendingProducts([
          { id: "1", title: "Premium Leather Backpack", price: "129.99", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80", rating: 4.9 },
          { id: "2", title: "Minimalist Watch", price: "89.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", rating: 4.8 },
          { id: "3", title: "Wireless Headphones", price: "199.99", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", rating: 4.7 },
          { id: "4", title: "Smart Water Bottle", price: "45.00", image: "https://images.unsplash.com/photo-1602143399827-7218ca053a42?auto=format&fit=crop&w=800&q=80", rating: 4.6 }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch trending products", error);
      // Fallback to demo defaults if proxy fails
      setTrendingProducts([
        { id: "1", title: "Premium Leather Backpack", price: "129.99", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80", rating: 4.9 },
        { id: "2", title: "Minimalist Watch", price: "89.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", rating: 4.8 },
        { id: "3", title: "Wireless Headphones", price: "199.99", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", rating: 4.7 },
        { id: "4", title: "Smart Water Bottle", price: "45.00", image: "https://images.unsplash.com/photo-1602143399827-7218ca053a42?auto=format&fit=crop&w=800&q=80", rating: 4.6 }
      ]);
      toast.error("Failed to load trending products. Using demo data.");
    } finally {
      setIsFetchingTrending(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInfo.orderNumber || !trackingInfo.email) return;
    setIsTracking(true);
    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingInfo)
      });
      if (!response.ok) throw new Error("Failed to track order");
      const orders = await response.json();
      const order = orders[0];
      
      if (order) {
        setTrackingResult({
          order_number: order.name,
          status: order.fulfillment_status || "unfulfilled",
          created_at: order.created_at,
          tracking_url: order.fulfillments?.[0]?.tracking_url || "https://www.fedex.com/tracking",
          isDemo: !isConfigured
        });
      } else {
        setTrackingResult(null);
        toast.error("Order not found. Please check your details.");
      }
    } catch (error) {
      console.error("Tracking error", error);
      toast.error("Failed to track order. Please try again later.");
    } finally {
      setIsTracking(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackInfo.name || !callbackInfo.email || !callbackInfo.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(callbackInfo.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubmittingCallback(true);
    try {
      const response = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callbackInfo)
      });
      if (!response.ok) throw new Error("Failed to submit callback request");
      if (response.ok) {
        setCallbackSuccess(true);
        setCallbackInfo({ name: "", phone: "", email: "", interest: "" });
        toast.success("Callback request received! We'll be in touch soon.");
        setTimeout(() => setCallbackSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Callback error", error);
      toast.error("Failed to submit callback request. Please try again.");
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  const handleRequestHandover = () => {
    if (socketRef.current) {
      socketRef.current.emit("request_handover", chatId);
      toast.success("Requesting a human agent...");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?chatId=${chatId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      toast.error("Failed to load user profile.");
    }
  };

  const checkConfig = async () => {
    try {
      const response = await fetch("/api/shopify/status");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check config: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setIsConfigured(data.configured);
      setShopName(data.shopName || "");
    } catch (error) {
      console.error("Failed to check config", error);
      toast.error("Failed to connect to Shopify. Please check your settings.");
    }
  };

  const fetchFaqs = async () => {
    try {
      const response = await fetch("/api/admin/faqs");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch FAQs: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
      toast.error("Failed to load FAQs.");
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policy');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch policies: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to load store policies.");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
      if (data.welcomeMessage && messages.length === 1 && messages[0].id === "1") {
        setMessages([{
          ...messages[0],
          content: data.welcomeMessage
        }]);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      // No toast here as this is a background fetch for public settings
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: { "x-admin-key": adminPassword }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
      toast.error("Failed to load analytics data.");
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist");
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      const data = await response.json();
      setWishlist(data);
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
      toast.error("Failed to load wishlist.");
    }
  };

  const trackEvent = async (type: "conversation" | "message" | "toolCall" | "lead" | "abandonment_nudge") => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (isAdminAuthenticated && isAdminMode) fetchAnalytics();
    } catch (error) {
      console.error("Failed to track event", error);
    }
  };

  const addToWishlist = async (product: any) => {
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      fetchWishlist();
    } catch (error) {
      console.error("Failed to add to wishlist", error);
    }
  };

  const addToCart = async (product: any, quantity: number = 1) => {
    const newItem = {
      productId: product.id,
      title: product.title,
      price: parseFloat(product.price),
      quantity,
      image: product.image
    };

    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.productId === product.id);
      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...prev.items];
        newItems[existingItemIndex].quantity += quantity;
      } else {
        newItems = [...prev.items, newItem];
      }
      const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, total: newTotal };
    });

    // Update user profile preferences
    setUserProfile(prev => ({
      ...prev,
      preferences: Array.from(new Set([...prev.preferences, product.title.split(' ')[0]]))
    }));

    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: `Added ${quantity}x ${product.title} to cart.`,
      timestamp: new Date(),
      hidden: true
    }]);

    // Add confirmation message from model
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: `Great choice! **${quantity}x ${product.title}** has been added to your cart. 
        
Would you like to [Go to Cart](https://${shopName}.myshopify.com/cart) or continue shopping?`,
        timestamp: new Date(),
      }]);
    }, 500);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.productId !== productId);
      const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, total: newTotal };
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      const newItems = prev.items.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ).filter(item => item.quantity > 0);
      const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, total: newTotal };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
  };

  const applyDiscount = (code: string) => {
    const discountAmount = cart.total * 0.1; // 10% discount for demo
    setCart(prev => ({ ...prev, discount: { code, amount: discountAmount } }));
    return { status: "success", message: `Discount code '${code}' applied successfully! You saved $${discountAmount.toFixed(2)}.` };
  };

  const removeFromWishlist = async (id: string) => {
    try {
      await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      fetchWishlist();
    } catch (error) {
      console.error("Failed to remove from wishlist", error);
    }
  };

  const handleFeedback = async (messageId: string, rating: "helpful" | "unhelpful", comment?: string) => {
    try {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, feedback: { rating, comment } } : m
      ));

      const response = await fetch(`/api/feedback/${messageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, rating, comment })
      });

      if (!response.ok) {
        throw new Error("Failed to save feedback");
      }

      toast.success("Thank you for your feedback!", {
        style: {
          fontSize: '10px',
          borderRadius: '12px',
          background: '#202223',
          color: '#fff',
        },
        iconTheme: {
          primary: '#008060',
          secondary: '#fff',
        },
      });
    } catch (error) {
      console.error("Feedback error", error);
      toast.error("Failed to save feedback. Please try again.");
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || isLoading) return;

    // Email validation check for chat input
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const potentialEmail = messageContent.trim();
    if (emailRegex.test(potentialEmail) && potentialEmail.split(' ').length === 1) {
      if (!validateEmail(potentialEmail)) {
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: "model",
          content: "That doesn't look like a valid email address. Please double-check it!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
    }

    if (messages.length === 1) trackEvent("conversation");
    trackEvent("message");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    // Emit to socket
    if (socketRef.current) {
      socketRef.current.emit("send_message", { chatId, message: userMessage });
    }

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      // Log to server
      fetch("/api/chat/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, messages: newMessages, userEmail: userProfile.name || "Guest" })
      }).catch(err => console.error("Failed to log chat", err));
      return newMessages;
    });
    setInput("");
    
    // If admin has taken over, don't call AI
    if (isHumanHandover) {
      return;
    }

    setIsLoading(true);
    setIsFetchingData(false);

    try {
      const contents = messages.concat(userMessage).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const systemInstruction = `${settings.systemPrompt}
        
        MULTILINGUAL SUPPORT:
        - Detect the user's language automatically.
        - Respond in the SAME language the user is using (e.g., English, Spanish, French, German, etc.).
        - If the user switches languages, you should switch too.

        URGENCY & CONVERSION RULES (CRITICAL):
        1. If a user is looking at a product, ALWAYS mention stock levels if they are low (e.g., "Only 2 left in stock!").
        2. If the cart total is high (> $100) and they haven't checked out, suggest a bundle or a discount code like 'SAVE10'.
        3. If they ask about shipping, remind them of our 'Free shipping on orders over $100' policy.
        4. Be proactive but professional. DO NOT use emojis in your responses. Keep the tone friendly but text-only.
        5. If you detect hesitation, offer a limited-time discount code.

        STATUS: ${isConfigured ? "Shopify is CONNECTED." : "Shopify is in DEMO MODE. You can use all tools, and they will return realistic demo data. Explain that this is a preview of the full integration."}

        USER PROFILE (Memory-Based Personalization):
        - Name: ${userProfile.name || "Guest"}
        - Preferences: ${userProfile.preferences.join(", ") || "None yet"}
        - Past Interests: ${userProfile.lastViewed.join(", ") || "None yet"}
        - Past Purchases: ${userProfile.pastPurchases.join(", ") || "None yet"}
        
        SHOPPING CART (Real-Time Actions):
        - Items: ${JSON.stringify(cart.items)}
        - Total: ${cart.total} ${cart.discount ? `(Discount ${cart.discount.code} applied: -$${cart.discount.amount})` : ""}

        CAPABILITIES:
        - AI Shopping Assistant: Help users find products and answer questions.
        - AI Checkout Assistant: Detect cart abandonment or high-value carts and suggest discounts (e.g., SAVE10) or bundles.
        - Real-Time Cart Actions: You can add/remove items and update quantities using tools.
        - Personalized Recommendations: Use the User Profile to suggest products they might actually like based on their past interests and purchases.
        - Voice Chatbot: You can simulate voice interactions (text-based for now).
        - AI Product Comparison: Compare different products based on their features and prices.
        - Sentiment Detection: Adjust your tone based on the user's mood.
        - AI Sales Agent: Proactively suggest products, highlight benefits, and encourage "Quick Add to Cart".
        
        TOOLS & NAVIGATION:
        - Cart Management: Use getCart, addToCart, removeFromCart, updateCartQuantity, clearCart.
        - Checkout: Use applyDiscount to help users save money.
        - Bestselling/Recommended: Use getRecommendations tool.
        - New Arrivals: Use searchProducts with "new" or "latest".
        - Assigned Categories: Use getAssignedProducts tool to find products in specific categories like 'Trending', 'New Arrivals', 'Best Sellers', or 'Sale'. These are curated by the store admin.
        - Search Product: Use searchProducts tool.
        - Policies: Use getStorePolicies tool.
        - Order Tracking: Use trackOrder tool.
        - Order History: Use getOrderHistory tool.
        - Admin Escalation: Use escalateToAdmin if you cannot resolve a query.
        
        IMPORTANT: When you find products, the UI will automatically render them if you mention their titles and prices clearly.
        Store Knowledge Base (FAQs): ${JSON.stringify(faqs)}
        Current Shop: ${shopName || "Demo Store"}
        
        USER PROFILE (Personalize your response based on this):
        - Name: ${userProfile.name || "Guest"}
        - Preferences: ${userProfile.preferences || "None set"}
        - Past Purchases: ${userProfile.pastPurchases || "None"}
        - Last Viewed: ${userProfile.lastViewed || "None"}
        
        If the user has preferences or past purchases, use that knowledge to make better recommendations.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction,
          tools: shopifyTools,
          chatId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI server.");
      }

      const data = await response.json();
      
      // If AI was skipped because of human handover
      if (data.skipAI) return;

      // Extract text parts manually to avoid the "non-text parts" warning when function calls are present
      const textParts = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text) || [];
      let finalContent = textParts.join("\n") || "";
      let foundProducts: any[] = [];
      let foundOrderHistory: any[] = [];
      
      const functionCalls = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall) || [];
      if (functionCalls.length > 0) {
        trackEvent("toolCall");
        setIsFetchingData(true);
        const toolResults = [];
        for (const call of functionCalls) {
          try {
            let result;
            const shopifyRes = await handleShopifyFunctionCall(call.name, call.args);
            
            if (shopifyRes && shopifyRes.__isLocal) {
              // Handle local tools
              switch (shopifyRes.tool) {
                case "getCart":
                  result = cart;
                  break;
                case "viewCart":
                  // For viewCart, we return the cart AND some personalized suggestions
                  const suggestions = await handleShopifyFunctionCall("getRecommendations", { limit: 2 });
                  result = { 
                    cart, 
                    suggestions: suggestions.products?.map((p: any) => ({
                      id: p.id,
                      title: p.title,
                      price: p.variants[0].price,
                      image: p.image?.src
                    })) || []
                  };
                  break;
                case "addToCart":
                  await addToCart(shopifyRes.args, shopifyRes.args.quantity || 1);
                  result = { status: "success", message: "Item added to cart." };
                  break;
                case "removeFromCart":
                  removeFromCart(shopifyRes.args.productId);
                  result = { status: "success", message: "Item removed from cart." };
                  break;
                case "updateCartQuantity":
                  updateCartQuantity(shopifyRes.args.productId, shopifyRes.args.quantity);
                  result = { status: "success", message: "Cart quantity updated." };
                  break;
                case "clearCart":
                  clearCart();
                  result = { status: "success", message: "Cart cleared." };
                  break;
                case "applyDiscount":
                  result = applyDiscount(shopifyRes.args.code);
                  break;
                case "getUserProfile":
                  result = userProfile;
                  break;
                default:
                  result = { error: "Tool not implemented locally" };
              }
            } else {
              result = shopifyRes;
            }

            if (call.name === "saveLead") trackEvent("lead");
            if (call.name === "addToWishlist") fetchWishlist();
            if (call.name === "escalateToAdmin") setIsEscalated(true);
            
            if (call.name === "getOrderHistory") {
              foundOrderHistory = result;
            }

            if (call.name === "searchProducts" && result.products) {
              if (result.products.length === 0) {
                // Handle empty results gracefully
                result.message = "I couldn't find any products matching your request. Would you like to try a different search term?";
              } else {
                const productsWithRatings = await Promise.all(result.products.map(async (p: any) => {
                  let avgRating = 4.5;
                  try {
                    const reviewsRes = await fetch(`/api/reviews/${p.id}`);
                    if (!reviewsRes.ok) throw new Error("Failed to fetch reviews");
                    const reviewsData = await reviewsRes.json();
                    if (reviewsData.length > 0) {
                      avgRating = reviewsData.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsData.length;
                    }
                  } catch (e) {
                    console.warn(`Review fetch failed for ${p.id}`, e);
                  }
                  return {
                    id: p.id,
                    title: p.title,
                    price: p.variants[0].price,
                    image: p.image?.src,
                    rating: avgRating
                  };
                }));
                foundProducts = [...foundProducts, ...productsWithRatings];
              }
            }

            if (call.name === "trackOrder" && result.error) {
              result.message = "I'm having trouble finding that order. Please double-check the order number and try again.";
            }

            if (call.name === "getRecommendations" && result.products) {
              const recs = result.products.map((p: any) => ({
                id: p.id,
                title: p.title,
                price: p.variants[0].price,
                image: p.image?.src,
                rating: 4.5
              }));
              foundProducts = [...foundProducts, ...recs];
            }

            if (call.name === "viewCart" && result.suggestions) {
              const suggestions = result.suggestions.map((p: any) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                image: p.image,
                rating: 4.8
              }));
              foundProducts = [...foundProducts, ...suggestions];
            }

            toolResults.push({
              functionResponse: {
                name: call.name,
                response: result,
              }
            });
          } catch (err: any) {
            console.error(`Tool call error (${call.name}):`, err);
            toolResults.push({
              functionResponse: {
                name: call.name,
                response: { 
                  error: "SERVICE_UNAVAILABLE",
                  message: "I'm sorry, I'm having trouble connecting to the store right now. Please try again in a moment."
                },
              }
            });
          }
        }
        setIsFetchingData(false);

        let secondResponse;
        const secondParams = {
          contents: [
            ...messages.concat(userMessage).map(m => ({
              role: m.role,
              parts: [{ text: m.content }]
            })),
            { role: "model", parts: data.candidates[0].content.parts },
            { role: "user", parts: toolResults }
          ],
          systemInstruction: `${settings.systemPrompt}
            
            MULTILINGUAL SUPPORT:
            - Detect the user's language automatically.
            - Respond in the SAME language the user is using (e.g., English, Spanish, French, German, etc.).
            - If the user switches languages, you should switch too.

            URGENCY & CONVERSION RULES (CRITICAL):
            1. If a user is looking at a product, ALWAYS mention stock levels if they are low (e.g., "Only 2 left in stock!").
            2. If the cart total is high (> $100) and they haven't checked out, suggest a bundle or a discount code like 'SAVE10'.
            3. If they ask about shipping, remind them of our 'Free shipping on orders over $100' policy.
            4. Be proactive but professional. Use emojis sparingly to keep it friendly.
            5. If you detect hesitation, offer a limited-time discount code.

            USER PROFILE (Memory-Based Personalization):
            - Name: ${userProfile.name || "Guest"}
            - Preferences: ${userProfile.preferences.join(", ") || "None yet"}
            - Past Interests: ${userProfile.lastViewed.join(", ") || "None yet"}
            - Past Purchases: ${userProfile.pastPurchases.join(", ") || "None yet"}
            
            SHOPPING CART:
            - Items: ${JSON.stringify(cart.items)}
            - Total: ${cart.total} ${cart.discount ? `(Discount ${cart.discount.code} applied)` : ""}

            You are a helpful Shopify AI Assistant. You have just used some tools to help the user. Now, provide a final response based on the tool results.`,
        };

        try {
          const secondRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(secondParams)
          });
          if (!secondRes.ok) throw new Error("Failed second AI call");
          const secondData = await secondRes.json();
          const secondTextParts = secondData.candidates?.[0]?.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text) || [];
          finalContent = secondTextParts.join("\n") || "I processed the store data but couldn't generate a text response.";
        } catch (error: any) {
          console.error("Second AI call failed:", error);
          finalContent = "I processed the store data but encountered an error generating the final response.";
        }
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: finalContent,
        timestamp: new Date(),
        products: foundProducts.length > 0 ? foundProducts : undefined,
        orderHistory: foundOrderHistory.length > 0 ? foundOrderHistory : undefined
      };

      // Emit to socket
      if (socketRef.current) {
        socketRef.current.emit("send_message", { chatId, message: modelMessage });
      }

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "model",
        content: "I'm sorry, I encountered an error while processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsFetchingData(false);
    }
  };

  const handleAddFaq = () => {
    const q = prompt("Question:");
    const a = prompt("Answer:");
    if (q && a) {
      fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminPassword },
        body: JSON.stringify({ question: q, answer: a }),
      }).then(fetchFaqs);
    }
  };

  const storefrontContent = (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative overflow-hidden transition-colors duration-300">
      {/* Demo Mode Banner */}
      {!isConfigured && isConfigured !== null && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
          <Zap className="w-3 h-3 fill-current" /> Demo Mode: Shopify Not Connected. Showing Sample Data. <Zap className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> New: AI Shopping Assistant
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-none">
              Shop Smarter with <span className="text-[#008060]">AI Intelligence</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Discover products tailored to your style, track orders in real-time, and get personalized deals—all through our intelligent chat assistant.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#008060] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for products (e.g. 'leather bag')..."
                className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008060] outline-none transition-all shadow-sm"
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' && e.target.value) {
                    setIsChatOpen(true);
                    setActiveTab("chat");
                    handleSend(`Search for ${e.target.value}`);
                    e.target.value = '';
                  }
                }}
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400">
                  ENTER
                </kbd>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={() => { setIsChatOpen(true); setActiveTab("chat"); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#008060] text-white rounded-2xl text-base sm:text-lg font-bold shadow-xl shadow-emerald-500/20 hover:bg-[#006e52] hover:-translate-y-1 transition-all"
              >
                <MessageSquare className="w-5 h-5" /> Start AI Chat
              </button>
              <button 
                onClick={() => { setIsChatOpen(true); setActiveTab("cart"); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#008060] border-2 border-[#008060] rounded-2xl text-base sm:text-lg font-bold shadow-lg hover:bg-emerald-50 hover:-translate-y-1 transition-all"
              >
                <ShoppingBag className="w-5 h-5" /> My Cart
              </button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-white" />
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">500+</span> happy shoppers this week
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="bg-[var(--bg-secondary)] rounded-[30px] sm:rounded-[40px] shadow-2xl border border-[var(--border-color)] p-4 sm:p-8 relative overflow-hidden group">
              <img 
                src={trendingProducts[0]?.image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"} 
                className="w-full h-[300px] sm:h-[400px] object-cover rounded-[24px] sm:rounded-[32px] shadow-lg transition-transform duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-12 sm:left-12 sm:right-12 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
                <div className="flex justify-between items-center mb-1 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#008060]">Featured Product</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] sm:text-xs font-bold">{trendingProducts[0]?.rating?.toFixed(1) || "4.9"}</span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1 truncate">{trendingProducts[0]?.title || "Premium Leather Backpack"}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">Limited edition handcrafted series.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl sm:text-2xl font-black text-[#008060]">${trendingProducts[0]?.price || "129.99"}</span>
                  <button 
                    onClick={() => { 
                      if (trendingProducts[0]) {
                        addToCart(trendingProducts[0], 1);
                      } else {
                        setIsChatOpen(true); 
                        setActiveTab("chat"); 
                      }
                    }}
                    className="bg-[#008060] text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#006e52] transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#008060]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Fast Shipping</h4>
              <p className="text-sm text-[var(--text-secondary)]">Free on orders over $100</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">AI Recommendations</h4>
              <p className="text-sm text-[var(--text-secondary)]">Tailored to your style</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Top Quality</h4>
              <p className="text-sm text-[var(--text-secondary)]">Verified customer reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Products Section */}
      <div className="py-12 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#008060]">Curated for you</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Trending Now</h2>
          </div>
          <button 
            onClick={() => { setIsChatOpen(true); setActiveTab("chat"); setInput("Show me trending products"); }}
            className="text-[#008060] text-sm sm:text-base font-bold flex items-center gap-2 hover:underline"
          >
            View all products <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isFetchingTrending ? (
            [1,2,3,4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-gray-200 rounded-3xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          ) : (
            trendingProducts.map(product => (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <img src={product.image || "https://picsum.photos/seed/product/400/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => addToCart(product, 1)}
                    className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md py-3 rounded-2xl font-bold text-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-white"
                  >
                    Quick Add to Cart
                  </button>
                </div>
                <h3 className="font-bold text-lg mb-1 truncate">{product.title}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-[#008060] font-black text-xl">${product.price}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold text-gray-600">{product.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Tracking & Callback Forms */}
      <div className="py-12 sm:py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
          {/* Order Tracking */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-600">Self Service</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Track Your Order</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)]">Enter your order details to see real-time status updates.</p>
            </div>
            
            <form onSubmit={handleTrackOrder} className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-xl border border-gray-100 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Order Number</label>
                  <input 
                    type="text" 
                    placeholder="#1001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all"
                    value={trackingInfo.orderNumber}
                    onChange={e => setTrackingInfo({...trackingInfo, orderNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all"
                    value={trackingInfo.email}
                    onChange={e => setTrackingInfo({...trackingInfo, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isTracking}
                className="w-full bg-[#008060] text-white py-4 rounded-2xl font-bold hover:bg-[#006e52] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTracking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                Track Order
              </button>

              {trackingResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase">Status</span>
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase">{trackingResult.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order</span>
                    <span className="font-bold">{trackingResult.order_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span className="font-bold">{new Date(trackingResult.created_at).toLocaleDateString()}</span>
                  </div>
                  {trackingResult.tracking_url && (
                    <a 
                      href={trackingResult.tracking_url} 
                      target="_blank" 
                      className="block w-full text-center py-2 bg-white border border-emerald-200 text-[#008060] rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                    >
                      View Carrier Tracking
                    </a>
                  )}
                  {trackingResult.isDemo && (
                    <p className="text-[10px] text-emerald-600 text-center italic">Showing demo tracking data</p>
                  )}
                </motion.div>
              )}
            </form>
          </div>

          {/* Callback Form */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-600">Concierge</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Request a Callback</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)]">Need help with a large order or custom request? Our team will call you back.</p>
            </div>
            
            <form onSubmit={handleCallbackSubmit} className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-xl border border-gray-100 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all"
                    value={callbackInfo.name}
                    onChange={e => setCallbackInfo({...callbackInfo, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all"
                    value={callbackInfo.phone}
                    onChange={e => setCallbackInfo({...callbackInfo, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all"
                  value={callbackInfo.email}
                  onChange={e => setCallbackInfo({...callbackInfo, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">I'm interested in...</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#008060] outline-none transition-all appearance-none"
                  value={callbackInfo.interest}
                  onChange={e => setCallbackInfo({...callbackInfo, interest: e.target.value})}
                >
                  <option value="">Select an option</option>
                  <option value="bulk">Bulk/Wholesale Orders</option>
                  <option value="custom">Custom Product Requests</option>
                  <option value="support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={isSubmittingCallback}
                className="w-full bg-[#008060] text-white py-4 rounded-2xl font-bold hover:bg-[#006e52] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingCallback ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                Request Callback
              </button>

              {callbackSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500 text-white rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Request sent successfully!
                </motion.div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="px-4 sm:px-8 pb-12 sm:pb-24 max-w-7xl mx-auto">
        <div className="bg-emerald-50 rounded-[30px] sm:rounded-[40px] p-8 sm:p-12 text-center text-[var(--text-primary)] relative overflow-hidden border border-emerald-100">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black">Get 10% Off Your First Order</h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Join our newsletter and be the first to know about new arrivals, exclusive offers, and AI-curated trends.</p>
            <div className="flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 bg-white rounded-2xl border border-emerald-200 shadow-sm">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-transparent px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-gray-400 text-sm"
              />
              <button 
                onClick={() => toast.success("Thank you for subscribing!")}
                className="bg-[#008060] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#006e52] transition-all text-sm"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--border-color)] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#008060] rounded-lg flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-[#008060]">{shopName || "Shopify Store"}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Experience the future of shopping with our AI-powered checkout assistant. Personalized recommendations, instant support, and seamless checkout.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[#008060] transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Best Sellers</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Sale</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Gift Cards</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[#008060] transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Returns & Exchanges</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Contact Us</a></li>
                <li className="pt-4 mt-2 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (isAdminAuthenticated) {
                        setIsAdminMode(true);
                        setActiveTab("analytics");
                      } else {
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className="text-[#008060] hover:text-[#006e52] transition-colors flex items-center gap-2 font-bold group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#008060]/10 flex items-center justify-center group-hover:bg-[#008060]/20 transition-all">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    {isAdminAuthenticated ? "Admin Dashboard" : "Admin Login"}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[#008060] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Refund Policy</a></li>
                <li><a href="#" className="hover:text-[#008060] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-secondary)]">
              © {new Date().getFullYear()} {shopName || "Shopify Store"}. All rights reserved. Design by Adarsh Singh
            </p>
            <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--text-secondary)] opacity-50">Secure Checkout Powered by AI</span>
              <div className="flex items-center gap-1 text-[#008060] font-bold">
                <div className="w-4 h-4 bg-[#008060] rounded flex items-center justify-center text-[8px] text-white">S</div>
                Powered by Shopify
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={() => {}}
      userMenu={
        <div className="flex items-center gap-4 px-4 h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#008060] flex items-center justify-center text-white font-bold text-xs">
              {isAdminAuthenticated ? "AD" : "ST"}
            </div>
            <div className="hidden sm:block">
              <Text as="p" variant="bodySm" fontWeight="bold">
                {isAdminAuthenticated ? "Admin Dashboard" : "Storefront View"}
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                {shopName || "Shopify Store"}
              </Text>
            </div>
          </div>
        </div>
      }
    />
  );

  return (
    <AppProvider i18n={{}}>
      <Frame
        topBar={isAdminMode ? topBarMarkup : undefined}
        navigation={
          isAdminMode && isAdminAuthenticated ? (
            <Navigation location="/">
              <Navigation.Section
                items={[
                  {
                    label: "Home",
                    icon: HomeIcon,
                    onClick: () => setActiveTab("analytics"),
                  },
                  {
                    label: "Analytics",
                    icon: ChartVerticalIcon,
                    onClick: () => setActiveTab("analytics"),
                    selected: activeTab === "analytics",
                  },
                  {
                    label: "AI Insights",
                    icon: MagicIcon,
                    onClick: () => setActiveTab("insights"),
                    selected: activeTab === "insights",
                  },
                  {
                    label: "Live Chat",
                    icon: ChatIcon,
                    onClick: () => setActiveTab("live"),
                    selected: activeTab === "live",
                  },
                  {
                    label: "Chat Logs",
                    icon: ChatIcon,
                    onClick: () => setActiveTab("logs"),
                    selected: activeTab === "logs",
                  },
                  {
                    label: "Leads",
                    icon: PersonIcon,
                    onClick: () => setActiveTab("leads"),
                    selected: activeTab === "leads",
                  },
                  {
                    label: "Customers",
                    icon: PersonIcon,
                    onClick: () => setActiveTab("customers"),
                    selected: activeTab === "customers",
                  },
                  {
                    label: "Orders",
                    icon: OrderIcon,
                    onClick: () => setActiveTab("orders"),
                    selected: activeTab === "orders",
                  },
                  {
                    label: "AI Training",
                    icon: TextIcon,
                    onClick: () => setActiveTab("training"),
                    selected: activeTab === "training",
                  },
                  {
                    label: "AI Configuration",
                    icon: SettingsIcon,
                    onClick: () => setActiveTab("config"),
                    selected: activeTab === "config",
                  },
                  {
                    label: "Automation",
                    icon: AutomationIcon,
                    onClick: () => setActiveTab("automation"),
                    selected: activeTab === "automation",
                  },
                  {
                    label: "Campaigns",
                    icon: MegaphoneIcon,
                    onClick: () => setActiveTab("campaigns"),
                    selected: activeTab === "campaigns",
                  },
                  {
                    label: "Assignments",
                    icon: ProductIcon,
                    onClick: () => setActiveTab("assignments"),
                    selected: activeTab === "assignments",
                  },
                  {
                    label: "Team",
                    icon: TeamIcon,
                    onClick: () => setActiveTab("team"),
                    selected: activeTab === "team",
                  },
                  {
                    label: "Integrations",
                    icon: ConnectIcon,
                    onClick: () => setActiveTab("integrations"),
                    selected: activeTab === "integrations",
                  },
                  {
                    label: "Notifications",
                    icon: NotificationIcon,
                    onClick: () => setActiveTab("notifications"),
                    selected: activeTab === "notifications",
                  },
                  {
                    label: "Settings",
                    icon: SettingsIcon,
                    onClick: () => setActiveTab("settings"),
                    selected: activeTab === "settings",
                  },
                  {
                    label: "Logs",
                    icon: FileIcon,
                    onClick: () => setActiveTab("system_logs"),
                    selected: activeTab === "system_logs",
                  },
                ]}
              />
              <Navigation.Section
                items={[
                  {
                    label: "Logout",
                    icon: ExitIcon,
                    onClick: () => {
                      setIsAdminAuthenticated(false);
                      setAdminPassword("");
                      localStorage.removeItem("admin_password");
                      setIsAdminMode(false);
                      setActiveTab("chat");
                    },
                  },
                ]}
              />
            </Navigation>
          ) : undefined
        }
      >
        {isAdminMode ? (
          isAdminAuthenticated ? (
            <Page title={
              activeTab === "analytics" ? "Store Analytics" : 
              activeTab === "leads" ? "Customer Leads" :
              activeTab === "logs" ? "Chat History" :
              activeTab === "assignments" ? "Product Categories" :
              activeTab === "settings" ? "AI Settings" :
              activeTab === "installation" ? "Installation Guide" :
              activeTab === "insights" ? "AI Insights" :
              activeTab === "customers" ? "Customers" :
              activeTab === "orders" ? "Orders" :
              activeTab === "config" ? "AI Configuration" :
              activeTab === "automation" ? "Automation" :
              activeTab === "campaigns" ? "Campaigns" :
              activeTab === "team" ? "Team" :
              activeTab === "integrations" ? "Integrations" :
              activeTab === "notifications" ? "Notifications" :
              activeTab === "system_logs" ? "Logs" :
              activeTab === "training" ? "AI Training" :
              activeTab === "live" ? "Live Chat" :
              "FAQ Management"
            }>
              <Layout>
                <Layout.Section>
                  <AdminDashboard 
                    stats={stats} 
                    faqs={faqs} 
                    onAddFaq={handleAddFaq} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    adminPassword={adminPassword}
                    shopName={shopName}
                  />
                </Layout.Section>
              </Layout>
            </Page>
          ) : (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <div className="w-full max-w-md">
                <Card>
                  <Box padding="600">
                    <BlockStack gap="500">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-[#008060]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Shield className="w-8 h-8 text-[#008060]" />
                        </div>
                        <Text as="h1" variant="headingLg">Admin Dashboard</Text>
                        <Text as="p" tone="subdued">Enter your password to manage your AI Assistant.</Text>
                      </div>

                      <FormLayout>
                        <div onKeyDown={(e: any) => e.key === "Enter" && handleAdminLogin()}>
                          <TextField
                            label="Admin Password"
                            type="password"
                            value={adminPassword}
                            onChange={setAdminPassword}
                            autoComplete="current-password"
                            placeholder="Enter password..."
                          />
                        </div>
                        <Button 
                          variant="primary" 
                          fullWidth 
                          onClick={() => handleAdminLogin()}
                          size="large"
                        >
                          Unlock Dashboard
                        </Button>
                      </FormLayout>

                      <Divider />

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <BlockStack gap="200">
                          <div className="flex items-center gap-2 text-blue-700">
                            <AlertCircle className="w-4 h-4" />
                            <Text as="p" variant="bodySm" fontWeight="bold">Hosting on Vercel?</Text>
                          </div>
                          <Text as="p" variant="bodyXs" tone="subdued">
                            Ensure you have set the <code className="bg-blue-100 px-1 rounded">ADMIN_PASSWORD</code> environment variable in your Vercel project settings.
                          </Text>
                        </BlockStack>
                      </div>

                      <Button variant="plain" fullWidth onClick={() => setIsAdminMode(false)}>
                        Return to Storefront
                      </Button>
                    </BlockStack>
                  </Box>
                </Card>
              </div>
            </div>
          )
        ) : storefrontContent}
        
        <Toaster position="top-center" />
        
        {!isAdminMode && (
          <ChatPopup 
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(!isChatOpen)}
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={(val?: string) => handleSend(val)}
            isLoading={isLoading}
            isFetchingData={isFetchingData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAdminMode={isAdminMode}
            setIsAdminMode={setIsAdminMode}
            wishlist={wishlist}
            onAddToWishlist={addToWishlist}
            onRemoveFromWishlist={removeFromWishlist}
            cart={cart}
            onUpdateCartQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
            onApplyDiscount={applyDiscount}
            messagesEndRef={messagesEndRef}
            isAdminAuthenticated={isAdminAuthenticated}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            onAdminLogin={() => handleAdminLogin()}
            onAdminLogout={() => {
              setIsAdminAuthenticated(false);
              setAdminPassword("");
              localStorage.removeItem("admin_password");
              setIsAdminMode(false);
              setActiveTab("chat");
            }}
            stats={stats}
            faqs={faqs}
            onAddFaq={handleAddFaq}
            shopName={shopName}
            onAddToCart={addToCart}
            isEscalated={isEscalated}
            onRequestHandover={handleRequestHandover}
            isConfigured={isConfigured}
            settings={settings}
            trackProductView={trackProductView}
            onFeedback={handleFeedback}
            policies={policies}
            userProfile={userProfile}
            onUpdateProfile={async (profile: any) => {
              setUserProfile(prev => ({ ...prev, ...profile }));
              try {
                const response = await fetch("/api/user/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chatId, profile })
                });
                if (!response.ok) throw new Error("Failed to sync profile");
                toast.success("Profile updated successfully");
              } catch (err) {
                console.error("Failed to sync profile", err);
                toast.error("Failed to save profile changes.");
              }
            }}
          />
        )}

        {/* Floating Chat Button */}
        {!isAdminMode && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-[#008060] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50 group ${isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
          >
            <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
          </button>
        )}

        {isAdminMode && !isAdminAuthenticated && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-[#008060] text-white px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider opacity-80 shadow-sm">
              Admin Mode Active
            </div>
          </div>
        )}
      </Frame>
      <Modal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Admin Login"
        primaryAction={{
          content: "Login",
          onAction: async () => {
            const success = await handleAdminLogin();
            if (success) {
              setIsLoginModalOpen(false);
              setIsAdminMode(true);
              setActiveTab("analytics");
            }
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsLoginModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Admin Password"
              type="password"
              value={adminPassword}
              onChange={setAdminPassword}
              autoComplete="current-password"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}
