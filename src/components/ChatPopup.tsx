import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "react-hot-toast";
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Star, 
  Heart, 
  Eye,
  MessageSquare, 
  RefreshCw,
  Search,
  Package,
  ShoppingBag,
  ShoppingCart,
  LayoutGrid,
  ThumbsUp,
  Zap,
  FileText,
  Phone,
  Trash2,
  Tag,
  Settings,
  Mic,
  MicOff,
  Copy,
  Plus,
  Minus,
  Check,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck
} from "lucide-react";
import Markdown from "react-markdown";

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

interface ChatPopupProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSend: (val?: string) => void;
  isLoading: boolean;
  isFetchingData: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  wishlist: any[];
  onAddToWishlist: (p: any) => void;
  onRemoveFromWishlist: (id: string) => void;
  cart: any;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onApplyDiscount: (code: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isAdminAuthenticated: boolean;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  onAdminLogin: () => void;
  onAdminLogout?: () => void;
  stats: any;
  faqs: any[];
  onAddFaq: () => void;
  shopName: string;
  onAddToCart: (p: any, quantity: number) => void;
  isEscalated: boolean;
  onRequestHandover?: () => void;
  isConfigured: boolean | null;
  settings: any;
  trackProductView: (p: any) => void;
  onFeedback: (messageId: string, rating: "helpful" | "unhelpful", comment?: string) => void;
  policies: {title: string, body: string}[];
  userProfile: {
    name: string;
    preferences: string[];
    pastPurchases: string[];
    lastViewed: string[];
  };
  onUpdateProfile: (profile: any) => void;
}

export function ChatPopup({
  isOpen,
  onToggle,
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  isFetchingData,
  activeTab,
  setActiveTab,
  isAdminMode,
  setIsAdminMode,
  wishlist,
  onAddToWishlist,
  onRemoveFromWishlist,
  cart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onApplyDiscount,
  messagesEndRef,
  isAdminAuthenticated,
  adminPassword,
  setAdminPassword,
  onAdminLogin,
  onAdminLogout,
  stats,
  faqs,
  onAddFaq,
  shopName,
  onAddToCart,
  isEscalated,
  onRequestHandover,
  isConfigured,
  settings,
  trackProductView,
  onFeedback,
  policies,
  userProfile,
  onUpdateProfile
}: ChatPopupProps) {
  const [selectedProductReviews, setSelectedProductReviews] = React.useState<{productId: string, reviews: any[]} | null>(null);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = React.useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [cartConfirmation, setCartConfirmation] = React.useState<{ productName: string, quantity: number } | null>(null);
  const [isFetchingReviews, setIsFetchingReviews] = React.useState(false);
  const [isFetchingQuickView, setIsFetchingQuickView] = React.useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = React.useState(0);
  const [sortBy, setSortBy] = React.useState<string>("default");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [callbackForm, setCallbackForm] = React.useState({ name: "", email: "", phone: "", reason: "General Inquiry" });
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isFetchingData]);

  const handleQuickView = async (productId: string) => {
    setIsFetchingQuickView(true);
    setCurrentImageIndex(0);
    try {
      // Fetch main product
      const res = await fetch("/api/shopify/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: `products/${productId}.json`, method: "GET" }),
      });
      const data = await res.json();
      if (data && data.product) {
        setSelectedQuickViewProduct(data.product);

        // Fetch related products (recommendations)
        // Using a simple search for similar products in the same collection or just a general search
        const recRes = await fetch("/api/shopify/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            endpoint: `products.json?limit=4&product_type=${data.product.product_type || ""}`, 
            method: "GET" 
          }),
        });
        const recData = await recRes.json();
        if (recData && recData.products) {
          setRelatedProducts(recData.products.filter((p: any) => p.id !== data.product.id));
        } else {
          setRelatedProducts([]);
        }
      } else {
        console.warn("Product data not found in proxy response");
      }
    } catch (error) {
      console.error("Failed to fetch product details", error);
    } finally {
      setIsFetchingQuickView(false);
    }
  };

  const handleAddToCartWithConfirmation = (product: any, quantity: number) => {
    onAddToCart(product, quantity);
    setCartConfirmation({ productName: product.title, quantity });
    setTimeout(() => setCartConfirmation(null), 4000);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      
      setInput(transcript);
      
      if (event.results[0].isFinal) {
        setIsListening(false);
        setTimeout(() => {
          onSend(transcript);
        }, 800);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        setVoiceError("Microphone access denied. Please enable it in your browser settings.");
      } else if (event.error === "no-speech") {
        setVoiceError("No speech detected. Try speaking again.");
      } else if (event.error === "network") {
        setVoiceError("Network error. Please check your connection.");
      } else if (event.error === "aborted") {
        console.log("Speech recognition aborted.");
      } else {
        setVoiceError(`Speech recognition error: ${event.error}`);
      }
      
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setTimeout(() => setVoiceError(null), 5000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleViewReviews = async (productId: string) => {
    setIsFetchingReviews(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      const data = await res.json();
      setSelectedProductReviews({ productId, reviews: data });
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const primaryColor = settings?.primaryColor || "#008060";
  const accentColor = settings?.accentColor || "#000000";
  const fontFamily = settings?.fontFamily || "Inter";
  const chatPosition = settings?.chatPosition || "bottom-right";

  return (
    <div style={{ "--primary-color": primaryColor, "--accent-color": accentColor, "--font-family": fontFamily } as React.CSSProperties}>
      {/* Floating Chat Button */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 ${chatPosition === "bottom-left" ? "left-6" : "right-6"} w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-[100] hover:scale-110 active:scale-95 ${
          isOpen ? "bg-[#202223] rotate-90" : "bg-[var(--primary-color)]"
        }`}
        style={{ fontFamily: "var(--font-family)" }}
      >
        {isOpen ? (
          <RefreshCw className="text-white w-8 h-8" />
        ) : (
          <MessageSquare className="text-white w-8 h-8" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 ${chatPosition === "bottom-left" ? "left-0 sm:left-6" : "right-0 sm:right-6"} sm:bottom-24 w-full h-full sm:w-[420px] sm:h-[700px] bg-[var(--bg-secondary)] text-[var(--text-primary)] sm:rounded-[32px] shadow-2xl border border-[var(--border-color)] flex flex-col z-[90] overflow-hidden transition-[background-color,border-color] duration-300`}
            style={{ fontFamily: "var(--font-family)" }}
          >
            {/* Quick View Modal Overlay */}
            <AnimatePresence>
              {selectedQuickViewProduct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="bg-[var(--bg-secondary)] w-full max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90%]"
                  >
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                      <h3 className="font-bold text-sm truncate pr-4">{selectedQuickViewProduct.title}</h3>
                      <button 
                        onClick={() => setSelectedQuickViewProduct(null)}
                        className="p-1.5 hover:bg-[var(--bg-primary)] rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar">
                      {/* Images Carousel */}
                      <div className="relative group/carousel">
                        <div className="flex gap-3 overflow-hidden rounded-2xl border border-[var(--border-color)] aspect-square bg-white">
                          <AnimatePresence mode="wait">
                            <motion.img 
                              key={currentImageIndex}
                              src={selectedQuickViewProduct.images[currentImageIndex]?.src} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer" 
                            />
                          </AnimatePresence>
                        </div>
                        
                        {selectedQuickViewProduct.images.length > 1 && (
                          <>
                            <button 
                              onClick={() => setCurrentImageIndex(prev => (prev === 0 ? selectedQuickViewProduct.images.length - 1 : prev - 1))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100"
                            >
                              <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                            </button>
                            <button 
                              onClick={() => setCurrentImageIndex(prev => (prev === selectedQuickViewProduct.images.length - 1 ? 0 : prev + 1))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100"
                            >
                              <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {selectedQuickViewProduct.images.map((_: any, i: number) => (
                                <div 
                                  key={i} 
                                  className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-4 bg-[#008060]" : "w-1.5 bg-gray-300"}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description</h4>
                        <div 
                          className="text-xs leading-relaxed text-[var(--text-primary)] prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedQuickViewProduct.body_html }}
                        />
                      </div>

                      {/* Variants */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Options</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedQuickViewProduct.variants.map((variant: any) => (
                            <div key={variant.id} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex flex-col gap-1">
                              <span className="text-[10px] font-bold truncate">{variant.title}</span>
                              <span className="text-xs font-black text-[#008060]">${variant.price}</span>
                              {variant.inventory_quantity > 0 ? (
                                <span className="text-[8px] text-emerald-500 font-bold uppercase">In Stock</span>
                              ) : (
                                <span className="text-[8px] text-rose-500 font-bold uppercase">Out of Stock</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Related Products */}
                      {relatedProducts.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Customers also bought</h4>
                          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {relatedProducts.map((p: any) => (
                              <div 
                                key={p.id} 
                                onClick={() => handleQuickView(p.id)}
                                className="min-w-[120px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-2 cursor-pointer hover:border-[#008060] transition-colors"
                              >
                                <img src={p.image?.src} className="w-full aspect-square object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />
                                <p className="text-[10px] font-bold truncate">{p.title}</p>
                                <p className="text-[10px] text-[#008060] font-black">${p.variants[0].price}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50 flex gap-3">
                      <a
                        href={`https://${shopName}.myshopify.com/products/${selectedQuickViewProduct.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-white text-[#008060] border-2 border-[#008060] rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </a>
                      <button 
                        onClick={() => {
                          handleAddToCartWithConfirmation(selectedQuickViewProduct, 1);
                          setSelectedQuickViewProduct(null);
                        }}
                        className="flex-1 py-3 bg-[#008060] text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-[#006e52] transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Confirmation Toast */}
            <AnimatePresence>
              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-4 right-4 z-[120] bg-rose-500 text-white p-3 rounded-xl shadow-2xl flex items-center gap-3"
                >
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold leading-tight">{voiceError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {cartConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-4 right-4 z-[120] bg-[#202223] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate max-w-[180px]">{cartConfirmation.productName}</p>
                      <p className="text-[10px] opacity-70">Added {cartConfirmation.quantity} item(s) to cart</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("chat")} // Or view cart logic
                    className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    View Cart
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews Modal Overlay */}
            <AnimatePresence>
              {selectedProductReviews && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-end"
                  onClick={() => setSelectedProductReviews(null)}
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="w-full bg-white rounded-t-3xl p-6 max-h-[80%] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Product Reviews</h3>
                      <button onClick={() => setSelectedProductReviews(null)} className="text-gray-400 hover:text-gray-600">
                        <RefreshCw className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                    
                    {selectedProductReviews.reviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No reviews yet for this product.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedProductReviews.reviews.map((review, idx) => (
                          <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm">{review.author}</span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(review.date).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Popup Header */}
            <header 
              className="p-4 sm:p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, var(--primary-color), var(--accent-color))` }}
            >
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                  {isEscalated ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg leading-tight">
                    {isEscalated ? "Human Support" : (settings.storeName || "Shopify AI")}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    {isEscalated ? "Human Agent Online" : "Assistant Online"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 relative z-10">
                {isAdminMode && (
                  <button 
                    onClick={() => {
                      setIsAdminMode(false);
                      setActiveTab("chat");
                    }} 
                    className="p-2 hover:bg-white/10 rounded-xl transition-all opacity-70 hover:opacity-100"
                    title="Back to Storefront"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                )}
                {!isEscalated && onRequestHandover && (
                  <button 
                    onClick={onRequestHandover}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all opacity-70 hover:opacity-100"
                    title="Talk to a human"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setActiveTab("chat")} className={`p-2 rounded-xl transition-all ${activeTab === "chat" ? "bg-white/20 scale-110" : "hover:bg-white/10 opacity-70"}`}>
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button onClick={() => setActiveTab("cart")} className={`p-2 rounded-xl transition-all ${activeTab === "cart" ? "bg-white/20 scale-110" : "hover:bg-white/10 opacity-70"}`}>
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5" />
                    {cart.items.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#008060]">
                        {cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </div>
                </button>
                 <button 
                  onClick={() => {
                    setActiveTab("admin");
                    setIsAdminMode(true);
                  }} 
                  className={`p-2 rounded-xl transition-all ${activeTab === "admin" ? "bg-white/20 scale-110" : "hover:bg-white/10 opacity-70"}`}
                  title="Admin Panel"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
                 {isAdminAuthenticated && onAdminLogout && (
                  <button 
                    onClick={onAdminLogout}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all opacity-70 hover:opacity-100"
                    title="Logout Admin"
                  >
                    <RefreshCw className="w-5 h-5 rotate-180" />
                  </button>
                 )}
                <button onClick={onToggle} className="sm:hidden p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Popup Content Area */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[var(--bg-primary)] transition-colors duration-300">
              {isConfigured === false && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Settings className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">Shopify Setup Required</p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Please configure your Shopify Shop Name and Access Token in the app settings to enable product searches and order tracking.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "chat" && (
                <div className="flex flex-col space-y-4">
                  <AnimatePresence mode="popLayout">
                    {messages.filter(m => !m.hidden).map((message) => (
                      <motion.div 
                        key={message.id} 
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          type: "spring", 
                          damping: 20, 
                          stiffness: 150,
                          layout: { duration: 0.3 }
                        }}
                        className="space-y-3"
                      >
                        <div
                          className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-[var(--primary-color)]`}>
                            {message.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                          </div>
                          <div className={`max-w-[90%] sm:max-w-[85%] p-3.5 sm:p-4 rounded-2xl shadow-md text-sm relative group ${
                            message.role === "user" 
                              ? "bg-white border border-gray-100 rounded-tr-none text-[var(--text-primary)]" 
                              : "text-white rounded-tl-none"
                          }`} style={message.role === "model" ? { background: `linear-gradient(135deg, var(--primary-color), var(--accent-color))` } : {}}>
                            <div className={`prose prose-sm max-w-none ${message.role === "model" ? "prose-invert" : "prose-slate dark:prose-invert"}`}>
                              <div className="markdown-body">
                                <Markdown>{message.content}</Markdown>
                              </div>
                            </div>
                            <div className={`text-[9px] mt-2 opacity-50 flex items-center gap-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {message.role === "user" && <Check className="w-2.5 h-2.5" />}
                            </div>
                            
                            {/* Copy Button */}
                            <div className={`absolute top-2 ${message.role === "user" ? "left-2" : "right-2"} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all`}>
                              {message.role === "model" && !message.feedback && (
                                <div className="flex items-center gap-1 mr-1 pr-1 border-r border-black/10">
                                  <button 
                                    onClick={() => onFeedback(message.id, "helpful")}
                                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-all"
                                    title="Helpful"
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const comment = prompt("How can we improve?");
                                      if (comment !== null) onFeedback(message.id, "unhelpful", comment);
                                    }}
                                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-all"
                                    title="Not helpful"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {message.feedback && (
                                <div className="flex items-center gap-1 mr-1 pr-1 border-r border-black/10">
                                  <span className="text-[8px] font-bold uppercase opacity-50">
                                    {message.feedback.rating === "helpful" ? "Helpful" : "Not helpful"}
                                  </span>
                                </div>
                              )}
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  toast.success("Copied to clipboard", {
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
                                }}
                                className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-all"
                                title="Copy message"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {message.products && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 sm:pl-10 overflow-x-auto no-scrollbar pb-1">
                              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[10px]">
                                <span className="text-[var(--text-secondary)]">Price:</span>
                                <select 
                                  className="bg-transparent outline-none font-bold"
                                  value={priceRange[1]}
                                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                                >
                                  <option value={1000}>All</option>
                                  <option value={50}>Under $50</option>
                                  <option value={100}>Under $100</option>
                                  <option value={200}>Under $200</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[10px]">
                                <span className="text-[var(--text-secondary)]">Rating:</span>
                                <select 
                                  className="bg-transparent outline-none font-bold"
                                  value={minRating}
                                  onChange={(e) => setMinRating(Number(e.target.value))}
                                >
                                  <option value={0}>Any</option>
                                  <option value={4}>4+ Stars</option>
                                  <option value={4.5}>4.5+ Stars</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[10px]">
                                <span className="text-[var(--text-secondary)] pr-1 border-r border-[var(--border-color)]">Sort:</span>
                                <select 
                                  className="bg-transparent outline-none font-bold"
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value)}
                                >
                                  <option value="default">Default</option>
                                  <option value="price-asc">Price: Low to High</option>
                                  <option value="price-desc">Price: High to Low</option>
                                  <option value="rating-desc">Rating: High to Low</option>
                                </select>
                              </div>
                            </div>
                            <motion.div 
                              initial="hidden"
                              animate="show"
                              variants={{
                                hidden: { opacity: 0 },
                                show: {
                                  opacity: 1,
                                  transition: {
                                    staggerChildren: 0.1
                                  }
                                }
                              }}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:pl-10"
                            >
                              {message.products
                                .filter(p => Number(p.price) <= priceRange[1] && (p.rating || 0) >= minRating)
                                .sort((a, b) => {
                                  if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
                                  if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
                                  if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
                                  return 0;
                                })
                                .map((product) => (
                                  <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onAddToCart={handleAddToCartWithConfirmation} 
                                    onAddToWishlist={onAddToWishlist}
                                    wishlist={wishlist}
                                    handleViewReviews={handleViewReviews}
                                    handleQuickView={handleQuickView}
                                    isFetchingQuickView={isFetchingQuickView}
                                    shopName={shopName}
                                    onSend={onSend}
                                    trackProductView={trackProductView}
                                  />
                                ))}
                            </motion.div>
                          </div>
                        )}

                        {message.orderHistory && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sm:pl-10 space-y-2"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-[#008060]" />
                              <span className="text-xs font-bold">Order History</span>
                            </div>
                            <div className="space-y-2">
                              {message.orderHistory.map((order: any) => (
                                <div key={order.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-xs shadow-sm">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-bold">{order.order_number}</span>
                                    <span className="text-[#008060] font-black">${order.total}</span>
                                  </div>
                                  <p className="text-[var(--text-secondary)] text-[10px] mb-1">{new Date(order.date).toLocaleDateString()}</p>
                                  <p className="truncate text-[10px]">{order.items}</p>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      order.status === "fulfilled" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-2 sm:gap-3 items-start"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#008060] flex items-center justify-center shrink-0 shadow-sm">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex gap-1.5 p-4 bg-gradient-to-br from-[#008060] to-[#006e52] rounded-2xl rounded-tl-none shadow-md">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                y: ["0%", "-50%", "0%"],
                                opacity: [0.4, 1, 0.4]
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 h-1.5 bg-white rounded-full"
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {settings.quickActionsEnabled && isQuickActionsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="grid grid-cols-2 gap-2 mt-4"
                      >
                        {[
                          { icon: Package, label: "Track Order", action: () => setActiveTab("track") },
                          { icon: Search, label: "Find Products", action: () => setInput("Show me your best products") },
                          { icon: FileText, label: "Store Policies", action: () => setActiveTab("policies") },
                          { icon: Phone, label: "Contact Support", action: () => setInput("I need to speak with someone") }
                        ].map((action, i) => (
                          <button
                            key={i}
                            onClick={action.action}
                            className="p-3 bg-white border border-[#E1E3E5] rounded-2xl flex flex-col items-center gap-2 hover:border-[#008060] hover:bg-[#F1F8F5] transition-all group shadow-sm"
                          >
                            <action.icon className="w-5 h-5 text-[#6D7175] group-hover:text-[#008060] transition-colors" />
                            <span className="text-[10px] font-bold text-[#202223]">{action.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {isFetchingData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#008060] flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-[#E1E3E5] p-4 rounded-2xl rounded-tl-none shadow-sm w-full space-y-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-[#008060]" />
                          <span className="text-[10px] font-bold text-[#008060] animate-pulse">Searching store...</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
                          <div className="h-2 bg-gray-100 rounded w-5/6 animate-pulse" />
                        </div>
                        <div className="flex gap-3 overflow-hidden">
                          {[1, 2].map((i) => (
                            <div key={i} className="min-w-[140px] h-[180px] bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
                              <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                              <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
                              <div className="flex gap-1 pt-1">
                                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Actions Grid Overlay Removed - Toggled in-chat instead */}

                  {/* Quick Actions / Suggested Prompts */}
                  {!isLoading && isQuickActionsOpen && (
                    <div className="pt-2">
                      <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {[
                          "Search products",
                          "Track my order",
                          "Latest arrivals",
                          "Customer support",
                          "Gift ideas"
                        ].map((action, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onSend(action.trim())}
                            className="whitespace-nowrap px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-xs font-medium text-[var(--text-primary)] hover:border-[#008060] hover:text-[#008060] transition-all shadow-sm active:scale-95 shrink-0"
                          >
                            {action}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  {isLoading && !isFetchingData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-[var(--primary-color)] flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {activeTab === "search" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#008060]" />
                      Search Products
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Find exactly what you're looking for in our store.</p>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          onSend(`Search for ${searchQuery}`);
                          setActiveTab("chat");
                        }
                      }}
                      placeholder="Enter product name, category..."
                      className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#008060] outline-none transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {["T-Shirts", "Hoodies", "Accessories", "Shoes", "Sale"].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => {
                          onSend(`Show me ${cat}`);
                          setActiveTab("chat");
                        }}
                        className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-xs font-bold hover:border-[#008060] hover:text-[#008060] transition-all"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "track" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#008060]" />
                      Track Your Order
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Enter your order ID to see the current status and location.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Order ID</label>
                      <input 
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. #ORD-12345"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#008060] outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (trackingNumber.trim()) {
                          onSend(`Track order ${trackingNumber}`);
                          setActiveTab("chat");
                        }
                      }}
                      className="w-full bg-[#008060] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#006e52] shadow-lg shadow-[#008060]/20 transition-all"
                    >
                      Track Order
                    </button>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#008060]">
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      <span className="text-xs font-bold">Real-time updates</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      We'll notify you automatically via email and SMS as soon as your order status changes.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "callback" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Phone className="w-5 h-5 text-[#008060]" />
                      Request a Callback
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Our support team will call you back within 24 hours.</p>
                  </div>

                  {formSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-emerald-900">Request Received!</h4>
                        <p className="text-xs text-emerald-800">{formSuccess}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setFormSuccess(null);
                          setActiveTab("chat");
                        }}
                        className="text-[#008060] text-xs font-bold hover:underline"
                      >
                        Back to Chat
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Full Name</label>
                        <input 
                          type="text"
                          value={callbackForm.name}
                          onChange={(e) => setCallbackForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#008060] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Email Address</label>
                        <input 
                          type="email"
                          value={callbackForm.email}
                          onChange={(e) => {
                            setCallbackForm(prev => ({ ...prev, email: e.target.value }));
                            if (emailError) setEmailError(null);
                          }}
                          placeholder="john@example.com"
                          className={`w-full bg-[var(--bg-primary)] border ${emailError ? "border-rose-500" : "border-[var(--border-color)]"} rounded-xl px-4 py-3 text-sm focus:border-[#008060] outline-none`}
                        />
                        {emailError && <p className="text-[10px] text-rose-500 font-bold">{emailError}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Phone Number</label>
                        <input 
                          type="tel"
                          value={callbackForm.phone}
                          onChange={(e) => setCallbackForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#008060] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Reason for Call</label>
                        <select 
                          value={callbackForm.reason}
                          onChange={(e) => setCallbackForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#008060] outline-none"
                        >
                          <option>General Inquiry</option>
                          <option>Order Issue</option>
                          <option>Product Question</option>
                          <option>Returns & Refunds</option>
                          <option>Technical Support</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          if (callbackForm.name && callbackForm.phone && callbackForm.email) {
                            if (!validateEmail(callbackForm.email)) {
                              setEmailError("Please enter a valid email address.");
                              return;
                            }
                            setIsSubmittingForm(true);
                            setTimeout(() => {
                              setIsSubmittingForm(false);
                              setFormSuccess("We've received your request. An agent will contact you shortly.");
                              onSend(`I've requested a callback for ${callbackForm.reason}. My name is ${callbackForm.name}, email is ${callbackForm.email} and phone is ${callbackForm.phone}.`);
                            }, 1500);
                          }
                        }}
                        disabled={isSubmittingForm || !callbackForm.name || !callbackForm.phone || !callbackForm.email}
                        className="w-full bg-[#008060] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#006e52] shadow-lg shadow-[#008060]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmittingForm ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Request Callback"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "wishlist" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    My Wishlist
                  </h3>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12 text-[#6D7175]">
                      <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your wishlist is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wishlist.map((item) => (
                        <div key={item.id} className="p-3 bg-white border border-[#E1E3E5] rounded-2xl flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                            <div>
                              <p className="text-xs font-bold leading-tight">{item.title}</p>
                              <p className="text-[10px] text-[#008060] font-black">${item.price}</p>
                            </div>
                          </div>
                          <button onClick={() => onRemoveFromWishlist(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                            <Heart className="w-4 h-4 fill-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "policies" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#008060]" />
                    Store Policies
                  </h3>
                  {policies.length === 0 ? (
                    <div className="text-center py-12 text-[#6D7175]">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No policies found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {policies.map((policy, idx) => (
                        <div key={idx} className="p-4 bg-white border border-[#E1E3E5] rounded-2xl shadow-sm space-y-2">
                          <h4 className="font-bold text-sm text-[#202223]">{policy.title}</h4>
                          <div className="text-xs text-[#6D7175] leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="markdown-body">
                              <Markdown>{policy.body}</Markdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cart" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#008060]" />
                      My Cart
                    </h3>
                    {cart.items.length > 0 && (
                      <button 
                        onClick={onClearCart}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {cart.items.length === 0 ? (
                    <div className="text-center py-12 text-[#6D7175]">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your cart is empty.</p>
                      <button 
                        onClick={() => setActiveTab("chat")}
                        className="mt-4 text-[#008060] font-bold text-xs hover:underline"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {cart.items.map((item: any) => (
                          <div key={item.id} className="p-3 bg-white border border-[#E1E3E5] rounded-2xl flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                              {item.image && <img src={item.image} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                              <div>
                                <p className="text-xs font-bold leading-tight">{item.title}</p>
                                <p className="text-[10px] text-[#008060] font-black">${item.price}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                <button 
                                  onClick={() => onUpdateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button 
                                onClick={() => onRemoveFromCart(item.id)}
                                className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-[#E1E3E5] rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6D7175]">Subtotal</span>
                          <span className="font-bold">${cart.total.toFixed(2)}</span>
                        </div>
                        {cart.discount && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Discount ({cart.discount.code})
                            </span>
                            <span className="font-bold">-${cart.discount.amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-black text-base">Total</span>
                          <span className="font-black text-lg text-[#008060]">
                            ${(cart.total - (cart.discount?.amount || 0)).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Discount code"
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#008060]"
                              onKeyDown={(e: any) => {
                                if (e.key === 'Enter' && e.target.value) {
                                  onApplyDiscount(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button className="bg-[#202223] text-white px-3 py-2 rounded-lg text-xs font-bold">
                              Apply
                            </button>
                          </div>
                        </div>

                        <button className="w-full bg-[#008060] text-white py-3 rounded-xl font-black text-sm hover:bg-[#006e52] transition-colors shadow-lg shadow-[#008060]/20 flex items-center justify-center gap-2 mt-2">
                          Checkout Now <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(activeTab === "admin" || activeTab === "analytics") && (
                <div className="h-full flex flex-col items-center justify-center p-4">
                  {!isAdminAuthenticated ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] p-8 text-center space-y-6 shadow-xl"
                    >
                      <div className="w-16 h-16 bg-[#008060]/10 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8 text-[#008060]" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl text-[var(--text-primary)]">Admin Authentication</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Please enter your password to access administrative features.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <input 
                            type="password" 
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onAdminLogin()}
                            placeholder="Enter Admin Password"
                            className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl px-4 py-4 text-sm focus:border-[#008060] outline-none transition-all text-center font-mono"
                          />
                        </div>
                        <button 
                          onClick={onAdminLogin} 
                          className="w-full bg-[#008060] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#006e52] transition-all shadow-lg shadow-[#008060]/20 active:scale-95"
                        >
                          Unlock Dashboard
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-full space-y-4">
                      {activeTab === "admin" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">FAQ Panel</h3>
                            <button onClick={onAddFaq} className="bg-[#008060] text-white px-3 py-1 rounded-lg text-xs font-bold">Add</button>
                          </div>
                          <div className="space-y-2">
                            {faqs.map(faq => (
                              <div key={faq.id} className="p-3 bg-white border border-[#E1E3E5] rounded-xl text-[11px]">
                                <p className="font-bold">{faq.question}</p>
                                <p className="text-[#6D7175] mt-1">{faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <StatCardMini label="Convs" value={stats.totalConversations} />
                          <StatCardMini label="Msgs" value={stats.totalMessages} />
                          <StatCardMini label="Tools" value={stats.toolCalls} />
                          <StatCardMini label="Leads" value={stats.leadsCaptured} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Popup Footer / Input */}
            {activeTab === "chat" && (
              <footer className="p-3 sm:p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] shrink-0 transition-colors duration-300 relative">
                {/* Voice Status Overlay */}
                <AnimatePresence>
                  {(isListening || voiceError) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-12 left-4 right-4 flex items-center justify-center pointer-events-none"
                    >
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2 ${
                        voiceError ? "bg-rose-500 text-white" : "bg-[#008060] text-white"
                      }`}>
                        {isListening ? (
                          <>
                            <div className="flex gap-1">
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                            Listening...
                          </>
                        ) : (
                          voiceError
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative flex items-center gap-1.5 sm:gap-3">
                  {settings.quickActionsEnabled && (
                    <button 
                      onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                      className={`p-2.5 sm:p-3 rounded-2xl transition-all ${isQuickActionsOpen ? "bg-[#008060] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[#008060] hover:bg-[var(--border-color)]"}`}
                      title="Quick Actions"
                    >
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  <button 
                    className={`p-2.5 sm:p-3 rounded-2xl transition-all ${isListening ? "bg-rose-100 text-rose-500 animate-pulse" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[#008060] hover:bg-[var(--border-color)]"}`}
                    title={isListening ? "Listening..." : "Voice Input"}
                    onClick={handleVoiceInput}
                  >
                    {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  <div className="relative flex-1 flex items-center group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (voiceError) setVoiceError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && onSend()}
                      placeholder="Ask anything..."
                      className="w-full bg-[var(--bg-primary)] border-2 border-transparent rounded-[20px] py-3 sm:py-3.5 pl-4 sm:pl-5 pr-12 sm:pr-14 text-xs sm:text-sm text-[var(--text-primary)] focus:bg-[var(--bg-secondary)] focus:border-[#008060]/20 focus:ring-0 transition-all outline-none"
                    />
                    <button
                      onClick={() => {
                        onSend();
                        if (voiceError) setVoiceError(null);
                      }}
                      disabled={!input.trim() || isLoading}
                      className={`absolute right-1.5 p-2 sm:p-2.5 rounded-[14px] transition-all ${
                        input.trim() && !isLoading ? "bg-[#008060] text-white shadow-lg shadow-[#008060]/20 scale-100" : "text-gray-300 scale-90"
                      }`}
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCardMini({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-[#E1E3E5] text-center">
      <p className="text-[10px] text-[#6D7175] uppercase font-bold">{label}</p>
      <p className="text-lg font-black text-[#202223]">{value}</p>
    </div>
  );
}

function ProductCard({ product, onAddToCart, onAddToWishlist, wishlist, handleViewReviews, handleQuickView, isFetchingQuickView, shopName, onSend, trackProductView }: any) {
  const [quantity, setQuantity] = React.useState(1);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (trackProductView) trackProductView(product);
  }, []);

  const handleCopy = () => {
    const url = `https://${shopName}.myshopify.com/products/${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRelatedSearch = () => {
    onSend(`Find products related to ${product.title}`);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-1.5 sm:p-4 shadow-md group relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {product.image && (
        <div className="relative overflow-hidden rounded-2xl mb-3 aspect-square bg-gray-100">
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          
          {/* Urgency Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.inventory_quantity !== undefined && product.inventory_quantity <= 3 && (
              <div className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-lg animate-pulse">
                Only {product.inventory_quantity} Left!
              </div>
            )}
            {parseFloat(product.price) < 50 && (
              <div className="px-2 py-1 bg-[#008060] text-white text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-lg">
                Best Seller
              </div>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
            <button 
              onClick={handleCopy}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors"
              title="Copy Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
            </button>
            <button 
              onClick={() => handleQuickView(product.id)}
              disabled={isFetchingQuickView}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors disabled:opacity-50"
              title="Quick View"
            >
              <Eye className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
      
      <div className="px-1">
        <h3 className="text-[11px] sm:text-xs font-bold truncate leading-tight mb-1 text-[var(--text-primary)]" title={product.title}>{product.title}</h3>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold text-[var(--text-secondary)]">{product.rating?.toFixed(1) || "4.8"}</span>
          </div>
          <p className="text-[#008060] font-black text-[11px] sm:text-sm">${product.price}</p>
        </div>
      </div>
      
      <div className="mt-auto space-y-2">
        {/* Quantity Selector */}
        <div className="flex items-center justify-between bg-[var(--bg-primary)] rounded-xl p-1 border border-[var(--border-color)]">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-primary)]"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-black text-[var(--text-primary)]">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-primary)]"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onAddToWishlist(product)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--bg-primary)] hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-colors text-[var(--text-secondary)] border border-[var(--border-color)] shrink-0"
            title="Add to Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlist.some((w: any) => w.id === product.id) ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
          <button
            onClick={() => onAddToCart(product, quantity)}
            className="flex-1 bg-[#008060] text-white text-[9px] sm:text-[11px] font-black py-2 rounded-xl hover:bg-[#006e52] transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-lg shadow-emerald-500/10 active:scale-95 whitespace-nowrap px-1"
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Add to Cart
          </button>
        </div>
        
        <div className="flex gap-1.5">
          <a 
            href={`https://${shopName}.myshopify.com/products/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white text-[#008060] border-2 border-[#008060] text-[9px] sm:text-[10px] font-black py-1.5 sm:py-2 rounded-xl hover:bg-emerald-50 transition-colors text-center flex items-center justify-center gap-0.5 sm:gap-1"
          >
            View Details <ExternalLink className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
          </a>
          <button
            onClick={() => {
              const url = `https://${shopName}.myshopify.com/products/${product.id}`;
              navigator.clipboard.writeText(url);
              toast.success("Product link copied!");
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--bg-primary)] hover:bg-emerald-50 hover:text-[#008060] rounded-xl transition-colors text-[var(--text-secondary)] border border-[var(--border-color)] shrink-0"
            title="Copy Product Link"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
