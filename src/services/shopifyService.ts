import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const shopifySearchProducts: FunctionDeclaration = {
  name: "searchProducts",
  parameters: {
    type: Type.OBJECT,
    description: "Search for products in the Shopify store by title or keywords.",
    properties: {
      query: {
        type: Type.STRING,
        description: "The search term or keywords to find products.",
      },
    },
    required: ["query"],
  },
};

const shopifyGetProductDetails: FunctionDeclaration = {
  name: "getProductDetails",
  parameters: {
    type: Type.OBJECT,
    description: "Get detailed information about a specific product using its ID.",
    properties: {
      productId: {
        type: Type.STRING,
        description: "The unique ID of the product.",
      },
    },
    required: ["productId"],
  },
};

const shopifyTrackOrder: FunctionDeclaration = {
  name: "trackOrder",
  parameters: {
    type: Type.OBJECT,
    description: "Track a customer's order status using their order number and email.",
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The order number (e.g., '#1001' or '1001').",
      },
      email: {
        type: Type.STRING,
        description: "The email address associated with the order.",
      },
    },
    required: ["orderNumber", "email"],
  },
};

const shopifyGetStorePolicies: FunctionDeclaration = {
  name: "getStorePolicies",
  parameters: {
    type: Type.OBJECT,
    description: "Get the store's policies like shipping, returns, and refunds.",
    properties: {},
  },
};

const shopifyGetRecommendations: FunctionDeclaration = {
  name: "getRecommendations",
  parameters: {
    type: Type.OBJECT,
    description: "Get recommended or best-selling products from the store.",
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Number of products to recommend (default 3).",
      },
    },
  },
};

const shopifySaveLead: FunctionDeclaration = {
  name: "saveLead",
  parameters: {
    type: Type.OBJECT,
    description: "Save a customer's contact information for follow-up.",
    properties: {
      name: { type: Type.STRING },
      email: { type: Type.STRING },
      phone: { type: Type.STRING },
      interest: { type: Type.STRING, description: "What the customer is interested in." },
    },
    required: ["name", "email"],
  },
};

const shopifyViewCart: FunctionDeclaration = {
  name: "viewCart",
  parameters: {
    type: Type.OBJECT,
    description: "View the customer's current shopping cart items and get suggestions.",
    properties: {},
  },
};

const shopifyAddToWishlist: FunctionDeclaration = {
  name: "addToWishlist",
  parameters: {
    type: Type.OBJECT,
    description: "Add a product to the customer's wishlist.",
    properties: {
      productId: { type: Type.STRING },
      title: { type: Type.STRING },
      price: { type: Type.STRING },
    },
    required: ["productId", "title"],
  },
};

const shopifyGetReviews: FunctionDeclaration = {
  name: "getProductReviews",
  parameters: {
    type: Type.OBJECT,
    description: "Get customer reviews for a specific product.",
    properties: {
      productId: { type: Type.STRING },
    },
    required: ["productId"],
  },
};

const shopifySubmitReview: FunctionDeclaration = {
  name: "submitReview",
  parameters: {
    type: Type.OBJECT,
    description: "Submit a new customer review for a product.",
    properties: {
      productId: { type: Type.STRING },
      rating: { type: Type.NUMBER, description: "Rating from 1 to 5" },
      comment: { type: Type.STRING },
      author: { type: Type.STRING },
    },
    required: ["productId", "rating", "comment", "author"],
  },
};

const shopifyGetOrderHistory: FunctionDeclaration = {
  name: "getOrderHistory",
  parameters: {
    type: Type.OBJECT,
    description: "Get a list of past orders for a customer using their email address.",
    properties: {
      email: {
        type: Type.STRING,
        description: "The email address associated with the orders.",
      },
    },
    required: ["email"],
  },
};

const shopifyEscalateToAdmin: FunctionDeclaration = {
  name: "escalateToAdmin",
  parameters: {
    type: Type.OBJECT,
    description: "Escalate the current conversation to a human admin for complex queries.",
    properties: {
      reason: {
        type: Type.STRING,
        description: "The reason for escalation.",
      },
    },
    required: ["reason"],
  },
};

const shopifyAddToCart: FunctionDeclaration = {
  name: "addToCart",
  parameters: {
    type: Type.OBJECT,
    description: "Add a product to the customer's shopping cart.",
    properties: {
      productId: { type: Type.STRING },
      variantId: { type: Type.STRING },
      title: { type: Type.STRING },
      price: { type: Type.STRING },
      quantity: { type: Type.NUMBER, default: 1 },
      image: { type: Type.STRING },
    },
    required: ["productId", "title", "price"],
  },
};

const shopifyRemoveFromCart: FunctionDeclaration = {
  name: "removeFromCart",
  parameters: {
    type: Type.OBJECT,
    description: "Remove a product from the customer's shopping cart.",
    properties: {
      productId: { type: Type.STRING },
    },
    required: ["productId"],
  },
};

const shopifyUpdateCartQuantity: FunctionDeclaration = {
  name: "updateCartQuantity",
  parameters: {
    type: Type.OBJECT,
    description: "Update the quantity of a product in the shopping cart.",
    properties: {
      productId: { type: Type.STRING },
      quantity: { type: Type.NUMBER },
    },
    required: ["productId", "quantity"],
  },
};

const shopifyClearCart: FunctionDeclaration = {
  name: "clearCart",
  parameters: {
    type: Type.OBJECT,
    description: "Remove all items from the shopping cart.",
    properties: {},
  },
};

const shopifyApplyDiscount: FunctionDeclaration = {
  name: "applyDiscount",
  parameters: {
    type: Type.OBJECT,
    description: "Apply a discount code to the current cart.",
    properties: {
      code: { type: Type.STRING, description: "The discount code (e.g., 'SAVE10', 'WELCOME20')." },
    },
    required: ["code"],
  },
};

const shopifyGetCart: FunctionDeclaration = {
  name: "getCart",
  parameters: {
    type: Type.OBJECT,
    description: "Get the current contents of the shopping cart.",
    properties: {},
  },
};

const shopifyGetUserProfile: FunctionDeclaration = {
  name: "getUserProfile",
  parameters: {
    type: Type.OBJECT,
    description: "Get the customer's profile, preferences, and purchase history for personalization.",
    properties: {},
  },
};

const shopifyGetAssignedProducts: FunctionDeclaration = {
  name: "getAssignedProducts",
  parameters: {
    type: Type.OBJECT,
    description: "Get products assigned to specific categories (e.g., Trending, New Arrivals, Best Sellers).",
    properties: {
      category: {
        type: Type.STRING,
        description: "The category name (e.g., 'Trending', 'New Arrivals', 'Best Sellers', 'Sale')."
      }
    },
    required: ["category"]
  }
};

export const shopifyTools = [
  {
    functionDeclarations: [
      shopifySearchProducts,
      shopifyGetProductDetails,
      shopifyTrackOrder,
      shopifyGetStorePolicies,
      shopifyGetRecommendations,
      shopifySaveLead,
      shopifyViewCart,
      shopifyAddToCart,
      shopifyRemoveFromCart,
      shopifyUpdateCartQuantity,
      shopifyClearCart,
      shopifyApplyDiscount,
      shopifyGetCart,
      shopifyGetUserProfile,
      shopifyAddToWishlist,
      shopifyGetReviews,
      shopifySubmitReview,
      shopifyGetOrderHistory,
      shopifyEscalateToAdmin,
      shopifyGetAssignedProducts,
    ],
  },
];

const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    title: "Premium Leather Backpack",
    variants: [{ price: "129.99" }],
    image: { src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" },
    inventory_quantity: 2,
    description: "Handcrafted from genuine top-grain leather, this backpack is perfect for daily commutes and weekend adventures."
  },
  {
    id: "demo-2",
    title: "Minimalist Watch",
    variants: [{ price: "85.00" }],
    image: { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" },
    inventory_quantity: 5,
    description: "A sleek, timeless design that complements any outfit. Features a Japanese quartz movement and scratch-resistant sapphire glass."
  },
  {
    id: "demo-3",
    title: "Wireless Noise-Cancelling Headphones",
    variants: [{ price: "199.00" }],
    image: { src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" },
    inventory_quantity: 1,
    description: "Immerse yourself in your music with industry-leading noise cancellation and crystal-clear sound quality."
  },
  {
    id: "demo-4",
    title: "Eco-Friendly Yoga Mat",
    variants: [{ price: "45.00" }],
    image: { src: "https://images.unsplash.com/photo-1592179900431-1e021ea53b28?auto=format&fit=crop&w=800&q=80" },
    inventory_quantity: 10,
    description: "Made from sustainable natural rubber, providing superior grip and cushioning for your practice."
  }
];

export async function handleShopifyFunctionCall(name: string, args: any) {
  const callProxy = async (endpoint: string, method = "GET", body?: any) => {
    try {
      const response = await fetch("/api/shopify/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, method, body }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Fallback to demo data if not configured
          return null;
        }
        throw new Error("Failed to call Shopify API");
      }
      return response.json();
    } catch (e) {
      return null;
    }
  };

  switch (name) {
    case "searchProducts":
      const searchRes = await callProxy(`products.json?title=${encodeURIComponent(args.query)}`);
      if (!searchRes) {
        const filtered = DEMO_PRODUCTS.filter(p => 
          p.title.toLowerCase().includes(args.query.toLowerCase()) || 
          p.description.toLowerCase().includes(args.query.toLowerCase())
        );
        return { products: filtered.length > 0 ? filtered : DEMO_PRODUCTS };
      }
      return searchRes;
    case "getProductDetails":
      const detailRes = await callProxy(`products/${args.productId}.json`);
      if (!detailRes) {
        const product = DEMO_PRODUCTS.find(p => p.id === args.productId) || DEMO_PRODUCTS[0];
        return { product };
      }
      return detailRes;
    case "trackOrder":
      const trackRes = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: args.orderNumber, email: args.email })
      });
      const trackOrders = await trackRes.json();
      const order = trackOrders[0];
      
      if (!order) {
        return {
          order_number: args.orderNumber,
          status: "fulfilled",
          financial_status: "paid",
          created_at: new Date().toISOString(),
          total_price: "129.99",
          tracking_url: "https://www.fedex.com/tracking",
          isDemo: true
        };
      }
      return {
        order_number: order.name,
        status: order.fulfillment_status || "unfulfilled",
        financial_status: order.financial_status,
        created_at: order.created_at,
        total_price: order.total_price,
        tracking_url: order.fulfillments?.[0]?.tracking_url,
      };
    case "getOrderHistory":
      const history = await callProxy(`orders.json?email=${encodeURIComponent(args.email)}&status=any`);
      if (!history) {
        return [
          {
            id: "demo-order-1",
            order_number: "#1001",
            total: "129.99",
            status: "fulfilled",
            date: new Date().toISOString(),
            items: "Premium Leather Backpack"
          }
        ];
      }
      return history.orders?.map((o: any) => ({
        id: o.id,
        order_number: o.name,
        total: o.total_price,
        status: o.fulfillment_status || "unfulfilled",
        date: o.created_at,
        items: o.line_items.map((item: any) => item.title).join(", ")
      })) || [];
    case "escalateToAdmin":
      return { status: "escalated", message: "Your request has been escalated to an admin. They will join the chat shortly." };
    case "getStorePolicies":
      const policyRes = await fetch("/api/policy");
      const policies = await policyRes.json();
      if (!policies || policies.length === 0) {
        return {
          policies: [
            { title: "Refund Policy", body: "We offer a 30-day money-back guarantee on all products." },
            { title: "Shipping Policy", body: "Free worldwide shipping on orders over $100." }
          ]
        };
      }
      return { policies };
    case "getRecommendations":
      const recRes = await callProxy(`products.json?limit=${args.limit || 3}`);
      if (!recRes) {
        return { products: DEMO_PRODUCTS.slice(0, args.limit || 3) };
      }
      return recRes;
    case "saveLead":
      const leadRes = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: args.name, email: args.email, phone: args.phone, interest: args.interest })
      });
      return { status: "success", message: "Customer interest recorded. A representative will reach out soon." };
    case "viewCart":
      return { __isLocal: true, tool: "viewCart", args };
    case "getCart":
      return { __isLocal: true, tool: "getCart", args };
    case "addToCart":
      return { __isLocal: true, tool: "addToCart", args };
    case "removeFromCart":
      return { __isLocal: true, tool: "removeFromCart", args };
    case "updateCartQuantity":
      return { __isLocal: true, tool: "updateCartQuantity", args };
    case "clearCart":
      return { __isLocal: true, tool: "clearCart", args };
    case "applyDiscount":
      return { __isLocal: true, tool: "applyDiscount", args };
    case "getUserProfile":
      return { __isLocal: true, tool: "getUserProfile", args };
    case "addToWishlist":
      const wishlistRes = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { id: args.productId, title: args.title, price: args.price } }),
      });
      return await wishlistRes.json();
    case "getProductReviews":
      const reviewsRes = await fetch(`/api/reviews/${args.productId}`);
      return await reviewsRes.json();
    case "submitReview":
      const submitRes = await fetch(`/api/reviews/${args.productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: args.rating, comment: args.comment, author: args.author }),
      });
      return await submitRes.json();
    case "getAssignedProducts": {
      const { category } = args as { category: string };
      try {
        const response = await fetch("/api/admin/assignments");
        if (response.ok) {
          const assignments = await response.json();
          const productIds = assignments[category] || [];
          if (productIds.length === 0) return { error: `No products found in category: ${category}` };
          
          // Fetch product details for these IDs
          const productsRes = await callProxy(`products.json`);
          if (productsRes && productsRes.products) {
            return { 
              category,
              products: productsRes.products.filter((p: any) => productIds.includes(p.id.toString()))
            };
          } else {
            // Fallback to demo products if proxy fails
            return {
              category,
              products: DEMO_PRODUCTS.filter(p => productIds.includes(p.id.toString()))
            };
          }
        }
      } catch (e) {
        return { error: "Failed to fetch assigned products" };
      }
      return { error: "Failed to fetch assigned products" };
    }
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
