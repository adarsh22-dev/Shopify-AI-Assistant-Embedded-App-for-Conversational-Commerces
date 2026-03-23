import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, Text, BlockStack, InlineGrid, Icon, Badge, DataTable, Box, TextField, Button, Tabs, Layout, Banner, List, Divider, Scrollable } from "@shopify/polaris";
import { 
  ChatIcon, 
  OrderIcon, 
  ProductIcon, 
  PersonIcon, 
  SearchIcon, 
  TextIcon, 
  SendIcon, 
  AlertCircleIcon, 
  ClipboardIcon, 
  CodeIcon,
  MagicIcon,
  AutomationIcon,
  TeamIcon,
  ConnectIcon,
  NotificationIcon,
  SettingsIcon
} from "@shopify/polaris-icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ThumbsUp, Users, Megaphone, FileText } from "lucide-react";
import { Settings } from "./Settings";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

import { 
  AIInsightsTab, 
  CustomersTab, 
  OrdersTab, 
  AIConfigTab, 
  AutomationTab, 
  CampaignsTab, 
  TeamTab, 
  IntegrationsTab, 
  NotificationsTab, 
  SystemLogsTab 
} from "./AdminTabs";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  color: "success" | "info" | "caution" | "warning";
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""}>
      <Card>
        <BlockStack gap="200">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingSm" tone="subdued">
              {label}
            </Text>
            <Icon source={icon} tone={color} />
          </InlineGrid>
          <Text as="p" variant="headingLg">
            {value}
          </Text>
        </BlockStack>
      </Card>
    </div>
  );
}

interface AdminDashboardProps {
  stats: {
    totalConversations: number;
    totalMessages: number;
    toolCalls: number;
    leadsCaptured: number;
    helpfulFeedback: number;
    unhelpfulFeedback: number;
  };
  faqs: { id: string; question: string; answer: string }[];
  onAddFaq: () => void;
  activeTab: string;
  onTabChange?: (tab: any) => void;
  adminPassword?: string;
  shopName?: string;
}

export function AdminDashboard({ stats, faqs, onAddFaq, activeTab, onTabChange, adminPassword, shopName }: AdminDashboardProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilters, setLogFilters] = useState({
    dateRange: { start: "", end: "" },
    userEmail: "",
    minFeedback: 0,
  });
  const [logSort, setLogSort] = useState({
    key: "date",
    direction: "desc" as "asc" | "desc",
  });
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [faqSearch, setFaqSearch] = useState("");
  
  // AI Training state
  const [trainingDocs, setTrainingDocs] = useState<any[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Live Chat state
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    if (activeTab === "assignments" && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "leads") {
      fetchLeads();
    } else if (activeTab === "logs") {
      fetchLogs();
    } else if (activeTab === "assignments") {
      fetchAssignments();
    } else if (activeTab === "training") {
      fetchTrainingDocs();
    } else if (activeTab === "live") {
      fetchActiveChats();
      setupSocket();
    } else if (activeTab === "installation") {
      // No fetch needed for installation
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (selectedChatId && socketRef.current) {
      socketRef.current.emit("join_chat", selectedChatId);
    }
  }, [selectedChatId]);

  const setupSocket = () => {
    if (socketRef.current) return;
    
    const socket = io();
    socketRef.current = socket;

    socket.on("receive_message", (data) => {
      const { chatId: msgChatId, ...message } = data;
      setActiveChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === msgChatId);
        if (chatIndex > -1) {
          // Avoid duplicates
          if (prev[chatIndex].messages.find((m: any) => m.id === message.id)) return prev;
          
          const updated = [...prev];
          updated[chatIndex] = {
            ...updated[chatIndex],
            messages: [...updated[chatIndex].messages, message],
            lastActivity: new Date().toISOString()
          };
          return updated;
        }
        return prev;
      });
    });

    socket.on("admin_new_message", ({ chatId, message }) => {
      setActiveChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === chatId);
        if (chatIndex > -1) {
          const updated = [...prev];
          updated[chatIndex] = {
            ...updated[chatIndex],
            messages: [...updated[chatIndex].messages, message],
            lastActivity: new Date().toISOString()
          };
          return updated;
        } else {
          return [...prev, { id: chatId, messages: [message], isHumanHandover: false, lastActivity: new Date().toISOString() }];
        }
      });
    });

    socket.on("admin_handover_request", (chatId) => {
      setActiveChats(prev => prev.map(c => c.id === chatId ? { ...c, isHumanHandover: true } : c));
    });
  };

  const fetchTrainingDocs = async () => {
    try {
      const response = await fetch("/api/admin/training", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setTrainingDocs(data);
      }
    } catch (error) {
      console.error("Failed to fetch training docs", error);
    }
  };

  const handleAddTrainingDoc = async () => {
    if (!newDocTitle || !newDocContent) return;
    try {
      const response = await fetch("/api/admin/training", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminPassword || "" 
        },
        body: JSON.stringify({ title: newDocTitle, content: newDocContent })
      });
      if (response.ok) {
        const data = await response.json();
        setTrainingDocs([...trainingDocs, data]);
        setNewDocTitle("");
        setNewDocContent("");
        setIsAddingDoc(false);
      }
    } catch (error) {
      console.error("Failed to add training doc", error);
    }
  };

  const handleDeleteTrainingDoc = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/training/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (!response.ok) throw new Error("Failed to delete training doc");
      setTrainingDocs(trainingDocs.filter(d => d.id !== id));
      toast.success("Training document deleted");
    } catch (error) {
      console.error("Failed to delete training doc", error);
      toast.error("Failed to delete training document.");
    }
  };

  const fetchActiveChats = async () => {
    try {
      const response = await fetch("/api/admin/active-chats", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (!response.ok) throw new Error("Failed to fetch active chats");
      const data = await response.json();
      setActiveChats(data);
    } catch (error) {
      console.error("Failed to fetch active chats", error);
      toast.error("Failed to load active conversations.");
    }
  };

  const handleAdminReply = () => {
    if (!selectedChatId || !adminReply.trim() || !socketRef.current) return;
    
    const message = {
      id: Date.now().toString(),
      role: "model",
      content: adminReply,
      timestamp: new Date(),
      isHuman: true
    };

    socketRef.current.emit("admin_reply", { chatId: selectedChatId, message });
    setAdminReply("");
  };

  const handleTakeover = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("admin_takeover", chatId);
      setActiveChats(prev => prev.map(c => c.id === chatId ? { ...c, isHumanHandover: true } : c));
    }
  };

  const handleRelease = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("admin_release", chatId);
      setActiveChats(prev => prev.map(c => c.id === chatId ? { ...c, isHumanHandover: false } : c));
    }
  };

  const selectedChat = useMemo(() => activeChats.find(c => c.id === selectedChatId), [activeChats, selectedChatId]);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/admin/leads", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads", error);
      toast.error("Failed to load customer leads.");
    }
  };

  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      if (data.historicalData) {
        setHistoricalData(data.historicalData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
      toast.error("Failed to load analytics data.");
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, stats]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by User Email
    if (logFilters.userEmail) {
      const search = logFilters.userEmail.toLowerCase();
      result = result.filter(log => 
        log.messages.some((m: any) => 
          m.role === "user" && m.content.toLowerCase().includes(search)
        ) || log.id.toLowerCase().includes(search)
      );
    }

    // Filter by Date Range
    if (logFilters.dateRange.start) {
      const start = new Date(logFilters.dateRange.start).getTime();
      result = result.filter(log => new Date(log.date).getTime() >= start);
    }
    if (logFilters.dateRange.end) {
      const end = new Date(logFilters.dateRange.end).getTime() + 86400000; // Include full day
      result = result.filter(log => new Date(log.date).getTime() <= end);
    }

    // Filter by Feedback Rating
    if (logFilters.minFeedback > 0) {
      result = result.filter(log => 
        log.messages.some((m: any) => 
          m.feedback && (m.feedback.rating === "helpful" ? 5 : 1) >= logFilters.minFeedback
        )
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (logSort.key === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (logSort.key === "length") {
        valA = a.messages.length;
        valB = b.messages.length;
      } else {
        return 0;
      }

      if (logSort.direction === "asc") return valA - valB;
      return valB - valA;
    });

    return result;
  }, [logs, logFilters, logSort]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/logs", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/admin/assignments", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    }
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqs;
    const search = faqSearch.toLowerCase();
    return faqs.filter(f => 
      f.question.toLowerCase().includes(search) || 
      f.answer.toLowerCase().includes(search)
    );
  }, [faqs, faqSearch]);

  const chartData = useMemo(() => [
    { name: 'Conversations', value: stats.totalConversations },
    { name: 'Messages', value: stats.totalMessages },
    { name: 'Tool Calls', value: stats.toolCalls },
    { name: 'Leads', value: stats.leadsCaptured },
    { name: 'Helpful', value: stats.helpfulFeedback },
    { name: 'Unhelpful', value: stats.unhelpfulFeedback },
  ], [stats]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/shopify/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "products.json" })
      });
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to load products from Shopify");
    }
  };

  const handleAssignProduct = async () => {
    if (!selectedCategory || !selectedProductId) {
      toast.error("Please select both a category and a product");
      return;
    }

    const updatedAssignments = { ...assignments };
    if (!updatedAssignments[selectedCategory]) {
      updatedAssignments[selectedCategory] = [];
    }
    
    if (updatedAssignments[selectedCategory].includes(selectedProductId)) {
      toast.error("Product already assigned to this category");
      return;
    }

    updatedAssignments[selectedCategory] = [...updatedAssignments[selectedCategory], selectedProductId];

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminPassword || ""
        },
        body: JSON.stringify(updatedAssignments)
      });
      if (response.ok) {
        setAssignments(updatedAssignments);
        toast.success("Product assigned successfully");
        setIsAssigning(false);
        setSelectedProductId("");
      }
    } catch (error) {
      toast.error("Failed to save assignment");
    }
  };

  const handleRemoveAssignment = async (category: string, productId: string) => {
    const updatedAssignments = { ...assignments };
    updatedAssignments[category] = updatedAssignments[category].filter(id => id !== productId);

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminPassword || ""
        },
        body: JSON.stringify(updatedAssignments)
      });
      if (response.ok) {
        setAssignments(updatedAssignments);
        toast.success("Assignment removed");
      }
    } catch (error) {
      toast.error("Failed to remove assignment");
    }
  };

  const renderContent = () => {
    if (activeTab === "analytics") {
      return (
        <BlockStack gap="500">
          <InlineGrid columns="1fr auto" alignItems="center">
            <Text as="h2" variant="headingMd">Performance Overview</Text>
            <Button onClick={() => {
              toast.success("Analytics data refreshed");
              fetchAnalytics();
            }}>Refresh Analytics</Button>
          </InlineGrid>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <StatCard label="Conversations" value={stats.totalConversations} icon={ChatIcon} color="success" onClick={() => onTabChange?.("live")} />
            <StatCard label="Messages" value={stats.totalMessages} icon={OrderIcon} color="info" onClick={() => onTabChange?.("logs")} />
            <StatCard label="Tool Calls" value={stats.toolCalls} icon={ProductIcon} color="caution" onClick={() => onTabChange?.("system_logs")} />
            <StatCard label="Leads" value={stats.leadsCaptured} icon={PersonIcon} color="warning" onClick={() => onTabChange?.("leads")} />
            <StatCard label="Helpful Feedback" value={stats.helpfulFeedback} icon={ThumbsUp} color="success" onClick={() => onTabChange?.("logs")} />
            <StatCard label="Unhelpful Feedback" value={stats.unhelpfulFeedback} icon={AlertCircleIcon} color="warning" onClick={() => onTabChange?.("logs")} />
          </InlineGrid>

          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Overview Metrics</Text>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#008060" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Weekly Performance</Text>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" align="right" height={36}/>
                      <Line type="monotone" dataKey="msgs" stroke="#008060" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Messages" />
                      <Line type="monotone" dataKey="convs" stroke="#4a4a4a" strokeWidth={2} dot={{ r: 4 }} name="Convs" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </BlockStack>
            </Card>
          </InlineGrid>
        </BlockStack>
      );
    }

    if (activeTab === "training") {
      return (
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="400">
              <InlineGrid columns="1fr auto" gap="400">
                <Text as="h2" variant="headingMd">AI Training & Knowledge Base</Text>
                <button 
                  className="bg-[#008060] text-white px-4 py-2 rounded-lg hover:bg-[#006e52] transition-colors text-sm font-medium"
                  onClick={() => setIsAddingDoc(!isAddingDoc)}
                >
                  {isAddingDoc ? "Cancel" : "Add Document"}
                </button>
              </InlineGrid>
              <Text as="p" tone="subdued">Upload store policies, product guides, or custom documents to train the AI.</Text>
              
              {isAddingDoc && (
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="400">
                    <TextField label="Document Title" value={newDocTitle} onChange={setNewDocTitle} autoComplete="off" placeholder="e.g. Return Policy 2024" />
                    <TextField label="Content" value={newDocContent} onChange={setNewDocContent} autoComplete="off" multiline={6} placeholder="Paste document content here..." />
                    <InlineGrid columns="auto 1fr" gap="200">
                      <Button onClick={handleAddTrainingDoc} variant="primary">Save Document</Button>
                    </InlineGrid>
                  </BlockStack>
                </Box>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingDocs.map(doc => (
                  <div key={doc.id} className="p-4 border border-[#E1E3E5] rounded-xl bg-[#F9FAFB] flex justify-between items-start">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="bold">{doc.title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued" truncate>{doc.content.substring(0, 100)}...</Text>
                      <Text as="p" variant="bodyXs" tone="subdued">{new Date(doc.date).toLocaleDateString()}</Text>
                    </BlockStack>
                    <Button variant="tertiary" tone="critical" onClick={() => handleDeleteTrainingDoc(doc.id)}>Delete</Button>
                  </div>
                ))}
                {trainingDocs.length === 0 && !isAddingDoc && (
                  <div className="col-span-full py-12 text-center">
                    <Text as="p" tone="subdued">No training documents added yet.</Text>
                  </div>
                )}
              </div>
            </BlockStack>
          </Card>
        </BlockStack>
      );
    }

    if (activeTab === "live") {
      return (
        <Layout>
          <Layout.Section variant="oneThird">
            <Card padding="0">
              <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                <Text as="h2" variant="headingMd">Active Conversations</Text>
              </Box>
              <Scrollable style={{ height: '500px' }}>
                <div className="divide-y divide-gray-100">
                  {activeChats.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()).map(chat => (
                    <button 
                      key={chat.id} 
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex justify-between items-center ${selectedChatId === chat.id ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''}`}
                    >
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" fontWeight="bold">User: {chat.id.substring(0, 8)}</Text>
                        <Text as="p" variant="bodyXs" tone="subdued" truncate>{chat.messages[chat.messages.length - 1]?.content || "No messages"}</Text>
                      </BlockStack>
                      {chat.isHumanHandover && <Badge tone="warning">Handover</Badge>}
                    </button>
                  ))}
                  {activeChats.length === 0 && (
                    <div className="p-8 text-center">
                      <Text as="p" tone="subdued">No active chats.</Text>
                    </div>
                  )}
                </div>
              </Scrollable>
            </Card>
          </Layout.Section>
          <Layout.Section>
            {selectedChat ? (
              <Card padding="0">
                <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                  <div className="flex justify-between items-center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd">Chat with {selectedChat.id.substring(0, 8)}</Text>
                      <Text as="p" variant="bodyXs" tone="subdued">Last activity: {new Date(selectedChat.lastActivity).toLocaleTimeString()}</Text>
                    </BlockStack>
                    <div className="flex gap-2">
                      {selectedChat.isHumanHandover ? (
                        <Button onClick={() => handleRelease(selectedChat.id)} tone="critical">Release to AI</Button>
                      ) : (
                        <Button onClick={() => handleTakeover(selectedChat.id)} variant="primary">Take Over Chat</Button>
                      )}
                    </div>
                  </div>
                </Box>
                <Scrollable style={{ height: '400px' }} className="p-4 space-y-4 bg-gray-50">
                  {selectedChat.messages.map((msg: any, idx: number) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-white text-gray-800 rounded-tl-none' 
                          : msg.isHuman 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-gray-200 text-gray-800 rounded-tr-none'
                      }`}>
                        <Text as="p" variant="bodySm">{msg.content}</Text>
                        {msg.feedback && (
                          <div className={`mt-2 p-1.5 rounded text-[10px] flex items-center gap-1.5 ${msg.feedback.rating === 'helpful' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            <Icon source={msg.feedback.rating === 'helpful' ? ThumbsUp : AlertCircleIcon} tone="base" />
                            <span>{msg.feedback.rating === 'helpful' ? 'Helpful' : 'Unhelpful'}{msg.feedback.comment ? `: ${msg.feedback.comment}` : ''}</span>
                          </div>
                        )}
                        <div className={`text-[8px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                          {msg.isHuman ? "Agent" : msg.role === "model" ? "AI Bot" : "Customer"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </Scrollable>
                <Box padding="400" borderBlockStartWidth="025" borderColor="border">
                  <div className="flex gap-2">
                    <div className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAdminReply()}>
                      <TextField
                        label="Reply"
                        labelHidden
                        value={adminReply}
                        onChange={setAdminReply}
                        placeholder={selectedChat.isHumanHandover ? "Type your reply..." : "Take over chat to reply..."}
                        disabled={!selectedChat.isHumanHandover}
                        autoComplete="off"
                      />
                    </div>
                    <Button 
                      onClick={handleAdminReply} 
                      variant="primary" 
                      icon={SendIcon} 
                      disabled={!selectedChat.isHumanHandover || !adminReply.trim()}
                    />
                  </div>
                </Box>
              </Card>
            ) : (
              <Card>
                <div className="py-24 text-center">
                  <BlockStack align="center" inlineAlign="center" gap="400">
                    <Icon source={ChatIcon} tone="subdued" />
                    <Text as="p" tone="subdued">Select a conversation to start monitoring or replying.</Text>
                  </BlockStack>
                </div>
              </Card>
            )}
          </Layout.Section>
        </Layout>
      );
    }

    if (activeTab === "settings") {
      return <Settings adminPassword={adminPassword} shopName={shopName} />;
    }

    if (activeTab === "installation") {
      const installationCode = `<!-- AI Assistant Widget -->
<script>
  window.AI_ASSISTANT_CONFIG = {
    appUrl: "${window.location.origin}",
    shopName: "${shopName || 'your-store'}"
  };
</script>
<script src="${window.location.origin}/widget.js" async></script>`;

      return (
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="400">
              <Box>
                <InlineGrid columns="1fr auto" alignItems="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Shopify Theme Integration</Text>
                    <Text as="p" tone="subdued">Add the following code to your Shopify theme's <code>theme.liquid</code> file before the closing <code>&lt;/body&gt;</code> tag.</Text>
                  </BlockStack>
                  <Button 
                    icon={ClipboardIcon} 
                    onClick={() => {
                      navigator.clipboard.writeText(installationCode);
                      toast.success("Code copied to clipboard!");
                    }}
                  >
                    Copy Code
                  </Button>
                </InlineGrid>
              </Box>
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace' }}>
                  {installationCode}
                </pre>
              </Box>

              <Banner tone="info">
                <Text as="p">
                  This script will automatically load the AI Assistant on your storefront. Make sure your Shopify credentials are correctly configured in the environment variables.
                </Text>
              </Banner>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Manual Verification</Text>
              <Text as="p" tone="subdued">You can test the widget by visiting your store and checking for the chat icon in the bottom right corner.</Text>
              <List>
                <List.Item>Ensure <code>SHOPIFY_SHOP_NAME</code> matches your store's subdomain.</List.Item>
                <List.Item>Ensure <code>SHOPIFY_ACCESS_TOKEN</code> has the required permissions.</List.Item>
                <List.Item>If the widget doesn't appear, check the browser console for any errors.</List.Item>
              </List>
            </BlockStack>
          </Card>
        </BlockStack>
      );
    }

    if (activeTab === "leads") {
      const rows = leads.map(lead => [
        lead.name,
        lead.email,
        lead.phone || "N/A",
        lead.interest || "N/A",
        new Date(lead.date).toLocaleDateString()
      ]);

      return (
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Captured Leads</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Name', 'Email', 'Phone', 'Interest', 'Date']}
              rows={rows}
            />
            {leads.length === 0 && (
              <Box padding="400">
                <BlockStack align="center" inlineAlign="center">
                  <Text as="p" tone="subdued">No leads captured yet.</Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>
      );
    }

    if (activeTab === "logs") {
      return (
        <Card>
          <BlockStack gap="400">
            <InlineGrid columns="1fr auto" gap="400">
              <Text as="h2" variant="headingMd">Chat Logs</Text>
              <div className="flex gap-2">
                <select 
                  className="p-2 border border-[#E1E3E5] rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                  value={`${logSort.key}-${logSort.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split("-");
                    setLogSort({ key, direction: direction as "asc" | "desc" });
                  }}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="length-desc">Longest First</option>
                  <option value="length-asc">Shortest First</option>
                </select>
                <Button onClick={() => setLogFilters({ dateRange: { start: "", end: "" }, userEmail: "", minFeedback: 0 })} variant="tertiary" tone="critical">Reset</Button>
              </div>
            </InlineGrid>

            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                <TextField
                  label="Search Session/Content"
                  value={logFilters.userEmail}
                  onChange={(val) => setLogFilters(prev => ({ ...prev, userEmail: val }))}
                  autoComplete="off"
                  placeholder="Email or keyword..."
                />
                <TextField
                  label="Start Date"
                  type="date"
                  value={logFilters.dateRange.start}
                  onChange={(val) => setLogFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: val } }))}
                  autoComplete="off"
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={logFilters.dateRange.end}
                  onChange={(val) => setLogFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: val } }))}
                  autoComplete="off"
                />
                <div className="space-y-1">
                  <Text as="p" variant="bodySm">Min Feedback</Text>
                  <select 
                    className="w-full p-2 border border-[#E1E3E5] rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                    value={logFilters.minFeedback}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, minFeedback: Number(e.target.value) }))}
                  >
                    <option value={0}>Any</option>
                    <option value={5}>Helpful Only</option>
                    <option value={1}>Unhelpful Only</option>
                  </select>
                </div>
              </InlineGrid>
            </Box>

            <BlockStack gap="300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <Box key={log.id} padding="400" borderStyle="solid" borderColor="border" borderWidth="025" borderRadius="200" background="bg-surface-secondary">
                    <div className="flex justify-between mb-2">
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" fontWeight="bold">Session: {log.id}</Text>
                        <Text as="p" variant="bodyXs" tone="subdued">{log.messages.length} messages • {new Date(log.date).toLocaleString()}</Text>
                      </BlockStack>
                      <div className="flex gap-1">
                        {log.messages.some((m: any) => m.feedback?.rating === "helpful") && <Badge tone="success">Helpful</Badge>}
                        {log.messages.some((m: any) => m.feedback?.rating === "unhelpful") && <Badge tone="critical">Unhelpful</Badge>}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border-t border-gray-100 pt-3 mt-2">
                      {log.messages.map((msg: any, idx: number) => (
                        <div key={idx} className={`text-xs p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-white border border-blue-100 ml-8' : 'bg-emerald-50 border border-emerald-100 mr-8'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-black uppercase text-[8px] ${msg.role === 'user' ? 'text-blue-600' : 'text-emerald-700'}`}>{msg.role}</span>
                            <span className="text-[8px] opacity-40">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-800">
                            {msg.content}
                          </div>
                          {msg.feedback && (
                            <div className={`mt-2 p-2 rounded-lg text-[9px] font-bold flex items-center gap-2 ${msg.feedback.rating === 'helpful' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              <ThumbsUp className="w-3 h-3" />
                              <span>{msg.feedback.rating === 'helpful' ? 'Helpful' : 'Unhelpful'}{msg.feedback.comment ? `: ${msg.feedback.comment}` : ''}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Box>
                ))
              ) : (
                <Box padding="800">
                  <BlockStack align="center" inlineAlign="center" gap="200">
                    <Icon source={SearchIcon} tone="subdued" />
                    <Text as="p" tone="subdued">No chat logs found matching your filters.</Text>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      );
    }

    if (activeTab === "insights") {
      return <AIInsightsTab />;
    }
    if (activeTab === "customers") {
      return <CustomersTab />;
    }
    if (activeTab === "orders") {
      return <OrdersTab />;
    }
    if (activeTab === "config") {
      return <AIConfigTab />;
    }
    if (activeTab === "automation") {
      return <AutomationTab />;
    }
    if (activeTab === "campaigns") {
      return <CampaignsTab />;
    }
    if (activeTab === "team") {
      return <TeamTab />;
    }
    if (activeTab === "integrations") {
      return <IntegrationsTab />;
    }
    if (activeTab === "notifications") {
      return <NotificationsTab />;
    }
    if (activeTab === "system_logs") {
      return <SystemLogsTab />;
    }

    if (activeTab === "assignments") {
      return (
        <Card>
          <BlockStack gap="400">
            <InlineGrid columns="1fr auto" gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Product Assignments</Text>
                <Text as="p" tone="subdued">Assign products to specific categories for AI recommendations.</Text>
              </BlockStack>
              <Button variant="primary" onClick={() => setIsAssigning(true)}>Assign Product</Button>
            </InlineGrid>

            {isAssigning && (
              <Box padding="400" background="bg-surface-secondary" borderRadius="200" borderStyle="solid" borderColor="border" borderWidth="025">
                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">New Assignment</Text>
                  <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                    <div className="space-y-1">
                      <Text as="p" variant="bodySm">Category</Text>
                      <select 
                        className="w-full p-2 border border-[#E1E3E5] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {Object.keys(assignments).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Text as="p" variant="bodySm">Product</Text>
                      <select 
                        className="w-full p-2 border border-[#E1E3E5] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id.toString()}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="primary" onClick={handleAssignProduct}>Save</Button>
                      <Button onClick={() => setIsAssigning(false)}>Cancel</Button>
                    </div>
                  </InlineGrid>
                </BlockStack>
              </Box>
            )}

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              {Object.entries(assignments).map(([category, productIds]) => (
                <Box key={category} padding="400" borderStyle="solid" borderColor="border" borderWidth="025" borderRadius="200" background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      {category}
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {productIds.map(id => {
                        const product = products.find(p => p.id.toString() === id);
                        return (
                          <Box key={id} padding="100" background="bg-surface-secondary" borderRadius="100" borderStyle="solid" borderColor="border" borderWidth="025">
                            <div className="flex items-center gap-1 px-1">
                              <Text as="span" variant="bodyXs" tone="subdued">{product ? product.title : `ID: ${id}`}</Text>
                              <button 
                                onClick={() => handleRemoveAssignment(category, id)}
                                className="ml-1 hover:text-red-600 font-bold text-[10px]"
                                title="Remove assignment"
                              >
                                ×
                              </button>
                            </div>
                          </Box>
                        );
                      })}
                      {productIds.length === 0 && <Text as="p" variant="bodySm" tone="subdued">No products assigned</Text>}
                    </div>
                  </BlockStack>
                </Box>
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>
      );
    }

    return (
      <Card>
        <BlockStack gap="400">
          <InlineGrid columns="1fr auto" gap="400">
            <Text as="h2" variant="headingMd">
              FAQ Knowledge Base
            </Text>
            <Button variant="primary" onClick={onAddFaq}>
              Add FAQ
            </Button>
          </InlineGrid>
          
          <TextField
            label="Search FAQs"
            labelHidden
            value={faqSearch}
            onChange={setFaqSearch}
            autoComplete="off"
            placeholder="Search by question or answer..."
            prefix={<Icon source={SearchIcon} tone="base" />}
          />

          <BlockStack gap="300">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <div key={faq.id} className="p-4 border border-[#E1E3E5] rounded-lg bg-[#F9FAFB] hover:border-[#008060] transition-colors">
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {faq.question}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {faq.answer}
                  </Text>
                </div>
              ))
            ) : (
              <Box padding="800">
                <BlockStack align="center" inlineAlign="center" gap="200">
                  <Icon source={SearchIcon} tone="subdued" />
                  <Text as="p" tone="subdued">No FAQs found matching your search.</Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };

  return (
    <BlockStack gap="500">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#E1E3E5] shadow-sm">
        <BlockStack gap="100">
          <Text as="h1" variant="headingLg">{shopName || "Shopify Store"} Admin</Text>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <Text as="p" variant="bodyXs" tone="subdued">System Live & Monitoring</Text>
          </div>
        </BlockStack>
        <div className="flex items-center gap-4">
          <Badge tone="success">Active</Badge>
          <Text as="p" variant="bodyXs" tone="subdued">{new Date().toLocaleDateString()}</Text>
        </div>
      </div>
      {renderContent()}
    </BlockStack>
  );
}
