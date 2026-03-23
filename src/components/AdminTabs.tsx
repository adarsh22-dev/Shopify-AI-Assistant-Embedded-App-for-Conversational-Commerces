import React, { useState } from "react";
import { 
  Card, 
  Text, 
  BlockStack, 
  InlineGrid, 
  Box, 
  TextField, 
  Button, 
  Badge, 
  DataTable, 
  List, 
  Icon,
  Banner,
  Divider,
  Scrollable,
  Select,
  Checkbox,
  RangeSlider,
  Toast,
  Frame
} from "@shopify/polaris";
import { 
  MagicIcon, 
  PersonIcon, 
  OrderIcon, 
  SettingsIcon, 
  AutomationIcon, 
  MegaphoneIcon, 
  TeamIcon, 
  ConnectIcon, 
  NotificationIcon, 
  FileIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SearchIcon
} from "@shopify/polaris-icons";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from "react-hot-toast";

// --- AI Insights ---
export function AIInsightsTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const sentimentData = [
    { name: 'Positive', value: 65, color: '#008060' },
    { name: 'Neutral', value: 25, color: '#95a5a6' },
    { name: 'Negative', value: 10, color: '#e74c3c' },
  ];

  const topQueries = [
    { query: "Where is my order?", count: 145, conversion: "12%", trend: "+5%" },
    { query: "Do you have size M in blue?", count: 89, conversion: "24%", trend: "+12%" },
    { query: "What is your return policy?", count: 67, conversion: "5%", trend: "-2%" },
    { query: "Can I get a discount?", count: 54, conversion: "18%", trend: "+8%" },
  ];

  const metrics = [
    { label: "Avg. Response Time", value: "1.4s", trend: "-0.2s", tone: "success" },
    { label: "AI Resolution Rate", value: "82%", trend: "+4%", tone: "success" },
    { label: "Tokens Used (MTD)", value: "1.2M", trend: "+15%", tone: "attention" },
    { label: "Human Handovers", value: "42", trend: "-12%", tone: "success" },
  ];

  return (
    <BlockStack gap="500">
      <InlineGrid columns="1fr auto" alignItems="center">
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          {metrics.map((m, i) => (
            <Card key={i}>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">{m.label}</Text>
                <div className="flex items-baseline gap-2">
                  <Text as="p" variant="headingLg">{m.value}</Text>
                  <Badge tone={m.tone as any}>{m.trend}</Badge>
                </div>
              </BlockStack>
            </Card>
          ))}
        </InlineGrid>
        <Button onClick={handleRefresh} loading={isRefreshing}>Refresh Data</Button>
      </InlineGrid>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Sentiment Analysis</Text>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <InlineGrid columns="3" gap="200">
              {sentimentData.map(item => (
                <BlockStack key={item.name} align="center">
                  <Text as="p" variant="bodyXs" tone="subdued">{item.name}</Text>
                  <div style={{ color: item.color }}>
                    <Text as="p" variant="headingSm">{item.value}%</Text>
                  </div>
                </BlockStack>
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Top AI Queries</Text>
            <DataTable
              columnContentTypes={['text', 'numeric', 'text', 'text']}
              headings={['Query', 'Frequency', 'Conv. Rate', 'Trend']}
              rows={topQueries.map(q => [q.query, q.count, q.conversion, <Text as="span" tone={q.trend.startsWith('+') ? 'success' : 'critical'}>{q.trend}</Text>])}
            />
          </BlockStack>
        </Card>
      </InlineGrid>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">AI Performance Trends</Text>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { date: 'Mon', accuracy: 88, resolution: 72, volume: 120 },
                { date: 'Tue', accuracy: 92, resolution: 75, volume: 150 },
                { date: 'Wed', accuracy: 90, resolution: 78, volume: 180 },
                { date: 'Thu', accuracy: 94, resolution: 82, volume: 210 },
                { date: 'Fri', accuracy: 93, resolution: 85, volume: 240 },
                { date: 'Sat', accuracy: 95, resolution: 88, volume: 300 },
                { date: 'Sun', accuracy: 96, resolution: 90, volume: 320 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#008060" name="AI Accuracy %" strokeWidth={2} />
                <Line type="monotone" dataKey="resolution" stroke="#4a4a4a" name="Auto-Resolution %" strokeWidth={2} />
                <Line type="monotone" dataKey="volume" stroke="#2c6ecb" name="Query Volume" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// --- Customers ---
export function CustomersTab() {
  const [searchValue, setSearchValue] = useState("");
  const customers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', chats: 5, spend: '$240.00', segment: 'Loyal', lastActive: '2 hours ago' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', chats: 2, spend: '$45.00', segment: 'New', lastActive: '1 day ago' },
    { id: '3', name: 'Mike Ross', email: 'mike@example.com', chats: 12, spend: '$1,200.00', segment: 'VIP', lastActive: '15 mins ago' },
    { id: '4', name: 'Sarah Connor', email: 'sarah@example.com', chats: 8, spend: '$450.00', segment: 'Loyal', lastActive: '3 days ago' },
    { id: '5', name: 'Harvey Specter', email: 'harvey@example.com', chats: 1, spend: '$0.00', segment: 'Prospect', lastActive: 'Just now' },
  ];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchValue.toLowerCase()) || 
    c.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Card>
      <BlockStack gap="400">
        <InlineGrid columns="1fr auto" gap="400">
          <Text as="h2" variant="headingMd">Customer Insights</Text>
          <div className="flex gap-2">
            <TextField 
              label="Search customers" 
              labelHidden 
              prefix={<Icon source={SearchIcon} />} 
              autoComplete="off" 
              placeholder="Search..." 
              value={searchValue}
              onChange={setSearchValue}
            />
            <Button variant="secondary" onClick={() => alert("Exporting CSV...")}>Export CSV</Button>
          </div>
        </InlineGrid>
        <DataTable
          columnContentTypes={['text', 'text', 'numeric', 'text', 'text', 'text']}
          headings={['Name', 'Email', 'Chats', 'Total Spend', 'Segment', 'Last Active']}
          rows={filteredCustomers.map(c => [
            <Button variant="plain" onClick={() => alert(`Opening customer: ${c.name}`)}>{c.name}</Button>,
            c.email,
            c.chats,
            c.spend,
            <Badge tone={c.segment === 'VIP' ? 'success' : c.segment === 'Loyal' ? 'info' : c.segment === 'Prospect' ? 'attention' : 'warning'}>{c.segment}</Badge>,
            c.lastActive
          ])}
        />
      </BlockStack>
    </Card>
  );
}

// --- Orders ---
export function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const orders = [
    { id: '#1024', customer: 'John Doe', status: 'Fulfilled', ai_assisted: 'Yes', date: '2024-03-20', total: '$124.50', items: 3 },
    { id: '#1025', customer: 'Jane Smith', status: 'Pending', ai_assisted: 'No', date: '2024-03-21', total: '$45.00', items: 1 },
    { id: '#1026', customer: 'Mike Ross', status: 'Processing', ai_assisted: 'Yes', date: '2024-03-21', total: '$890.00', items: 5 },
    { id: '#1027', customer: 'Sarah Connor', status: 'Cancelled', ai_assisted: 'Yes', date: '2024-03-21', total: '$0.00', items: 0 },
  ];

  const filteredOrders = orders.filter(o => 
    statusFilter === "all" || o.status.toLowerCase() === statusFilter.toLowerCase()
  );

  return (
    <Card>
      <BlockStack gap="400">
        <InlineGrid columns="1fr auto" gap="400">
          <Text as="h2" variant="headingMd">Recent Orders</Text>
          <div className="flex gap-2">
            <Select
              label="Filter by Status"
              labelHidden
              options={[
                { label: 'All Orders', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Fulfilled', value: 'fulfilled' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </InlineGrid>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'numeric']}
          headings={['Order ID', 'Customer', 'Status', 'AI Assisted', 'Date', 'Total', 'Items']}
          rows={filteredOrders.map(o => [
            <Button variant="plain" onClick={() => alert(`Opening order: ${o.id}`)}>{o.id}</Button>,
            o.customer,
            <Badge tone={o.status === 'Fulfilled' ? 'success' : o.status === 'Cancelled' ? 'critical' : 'attention'}>{o.status}</Badge>,
            o.ai_assisted === 'Yes' ? <Badge tone="info">AI Assisted</Badge> : 'Direct',
            o.date,
            o.total,
            o.items
          ])}
        />
      </BlockStack>
    </Card>
  );
}

// --- AI Configuration ---
export function AIConfigTab() {
  const [temp, setTemp] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [model, setModel] = useState("gemini-3.1-pro");
  const [thinking, setThinking] = useState("medium");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI shopping assistant for a premium boutique. Your tone is professional, friendly, and proactive. Use the user's past interests to make personalized recommendations. If stock is low, mention it to create urgency.");
  const [welcomeMsg, setWelcomeMsg] = useState("Hi there! I'm your AI shopping assistant. How can I help you discover something amazing today?");
  const [webSearch, setWebSearch] = useState(true);
  const [deepLink, setDeepLink] = useState(true);
  const [multiLingual, setMultiLingual] = useState(true);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [storeDomain, setStoreDomain] = useState(true);
  const [sentimentDetection, setSentimentDetection] = useState(true);
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleReset = () => {
    setTemp(0.7);
    setTopP(0.9);
    setModel("gemini-3.1-pro");
    setThinking("medium");
    setSystemPrompt("You are a helpful AI shopping assistant for a premium boutique. Your tone is professional, friendly, and proactive. Use the user's past interests to make personalized recommendations. If stock is low, mention it to create urgency.");
    setWelcomeMsg("Hi there! I'm your AI shopping assistant. How can I help you discover something amazing today?");
    setWebSearch(true);
    setDeepLink(true);
    setMultiLingual(true);
    setProfanityFilter(true);
    setStoreDomain(true);
    setSentimentDetection(true);
    setKnowledgeUrl("");
    toast.success("Settings reset to defaults");
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
    }, 1000);
  };

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Model Parameters</Text>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm">Temperature (Creativity)</Text>
              <RangeSlider
                label="Temperature"
                labelHidden
                value={temp}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => setTemp(Number(val))}
                output
              />
            </BlockStack>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm">Top P (Nucleus Sampling)</Text>
              <RangeSlider
                label="Top P"
                labelHidden
                value={topP}
                min={0}
                max={1}
                step={0.05}
                onChange={(val) => setTopP(Number(val))}
                output
              />
            </BlockStack>
          </InlineGrid>
          <Divider />
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Select
              label="Base Model"
              options={[
                { label: 'Gemini 3.1 Pro (Recommended)', value: 'gemini-3.1-pro' },
                { label: 'Gemini 3.1 Flash (Faster)', value: 'gemini-3.1-flash' },
                { label: 'Gemini 3.0 Flash (Legacy)', value: 'gemini-3.0-flash' },
              ]}
              value={model}
              onChange={setModel}
            />
            <Select
              label="Thinking Level"
              options={[
                { label: 'High (Complex Reasoning)', value: 'high' },
                { label: 'Medium (Balanced)', value: 'medium' },
                { label: 'Low (Fast Response)', value: 'low' },
              ]}
              value={thinking}
              onChange={setThinking}
            />
          </InlineGrid>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">System Prompt & Persona</Text>
          <TextField
            label="System Instruction"
            multiline={6}
            value={systemPrompt}
            onChange={setSystemPrompt}
            autoComplete="off"
            helpText="This defines the core behavior and personality of your AI."
          />
          <TextField
            label="Welcome Message"
            value={welcomeMsg}
            onChange={setWelcomeMsg}
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Safety & Grounding</Text>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <BlockStack gap="200">
              <Checkbox label="Enable Web Search Grounding" checked={webSearch} onChange={setWebSearch} />
              <Checkbox label="Enable Product Catalog Deep-Link" checked={deepLink} onChange={setDeepLink} />
              <Checkbox label="Enable Multi-lingual Support" checked={multiLingual} onChange={setMultiLingual} />
            </BlockStack>
            <BlockStack gap="200">
              <Checkbox label="Filter Profanity" checked={profanityFilter} onChange={setProfanityFilter} />
              <Checkbox label="Restrict to Store Domain" checked={storeDomain} onChange={setStoreDomain} />
              <Checkbox label="Enable Sentiment Detection" checked={sentimentDetection} onChange={setSentimentDetection} />
            </BlockStack>
          </InlineGrid>
          <TextField
            label="Custom Knowledge URL"
            placeholder="https://yourstore.com/docs"
            autoComplete="off"
            value={knowledgeUrl}
            onChange={setKnowledgeUrl}
          />
          <div className="flex justify-end gap-2">
            <Button variant="tertiary" onClick={handleReset}>Reset to Default</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Save AI Configuration</Button>
          </div>
        </BlockStack>
      </Card>
      {showToast && <Toast content="Configuration saved successfully" onDismiss={() => setShowToast(false)} />}
    </BlockStack>
  );
}

// --- Automation ---
export function AutomationTab() {
  const [workflows, setWorkflows] = useState([
    { name: "Cart Abandonment Recovery", trigger: "Cart idle for 30m", action: "Send AI personalized nudge", status: "Active", runs: 1240, conv: "15%" },
    { name: "VIP Welcome Series", trigger: "Customer spend > $500", action: "AI personalized greeting", status: "Active", runs: 450, conv: "28%" },
    { name: "Out of Stock Alert", trigger: "Product back in stock", action: "Notify interested leads", status: "Paused", runs: 890, conv: "8%" },
    { name: "First Purchase Discount", trigger: "New customer sign up", action: "Send 10% discount code", status: "Active", runs: 2100, conv: "12%" },
  ]);

  const toggleStatus = (index: number) => {
    const newWorkflows = [...workflows];
    newWorkflows[index].status = newWorkflows[index].status === "Active" ? "Paused" : "Active";
    setWorkflows(newWorkflows);
  };

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingMd">Active Workflows</Text>
            <Button variant="primary" onClick={() => alert("Opening workflow builder...")}>Create Workflow</Button>
          </InlineGrid>
          <div className="space-y-4">
            {workflows.map((w, i) => (
              <Box key={i} padding="400" background="bg-surface-secondary" borderRadius="200" borderStyle="solid" borderColor="border" borderWidth="025">
                <InlineGrid columns="1fr auto" alignItems="center">
                  <BlockStack gap="100">
                    <div className="flex items-center gap-2">
                      <Text as="p" variant="bodyMd" fontWeight="bold">{w.name}</Text>
                      <Badge tone={w.status === 'Active' ? 'success' : undefined}>{w.status}</Badge>
                    </div>
                    <Text as="p" variant="bodySm" tone="subdued">Trigger: {w.trigger} • Action: {w.action}</Text>
                    <div className="flex gap-4 mt-1">
                      <Text as="p" variant="bodyXs" tone="subdued">Total Runs: <span className="font-bold text-gray-700">{w.runs}</span></Text>
                      <Text as="p" variant="bodyXs" tone="subdued">Conversion: <span className="font-bold text-emerald-600">{w.conv}</span></Text>
                    </div>
                  </BlockStack>
                  <div className="flex gap-2">
                    <Button variant="tertiary" onClick={() => alert(`Editing: ${w.name}`)}>Edit</Button>
                    <Button variant="tertiary" tone="critical" onClick={() => toggleStatus(i)}>{w.status === 'Active' ? 'Pause' : 'Resume'}</Button>
                  </div>
                </InlineGrid>
              </Box>
            ))}
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// --- Campaigns ---
export function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([
    { name: 'Spring Sale AI Nudge', type: 'Email/SMS', status: 'Running', roi: '4.2x', reach: '1,240', revenue: '$12,450' },
    { name: 'New Arrival Promo', type: 'Storefront', status: 'Scheduled', roi: '-', reach: '0', revenue: '$0' },
    { name: 'Flash Sale Recovery', type: 'Multi-channel', status: 'Draft', roi: '-', reach: '0', revenue: '$0' },
    { name: 'Holiday Gift Guide', type: 'Email', status: 'Completed', roi: '6.8x', reach: '5,600', revenue: '$45,200' },
  ]);

  const handleNewCampaign = () => {
    const name = prompt("Enter campaign name:");
    if (!name) return;
    setCampaigns([
      ...campaigns,
      { name, type: 'Email', status: 'Draft', roi: '-', reach: '0', revenue: '$0' }
    ]);
    toast.success("Campaign draft created");
  };

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingMd">AI Marketing Campaigns</Text>
            <Button variant="primary" onClick={handleNewCampaign}>New Campaign</Button>
          </InlineGrid>
          <DataTable
            columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
            headings={['Campaign Name', 'Type', 'Status', 'ROI', 'Reach', 'Revenue']}
            rows={campaigns.map(c => [
              c.name,
              c.type,
              <Badge tone={c.status === 'Running' ? 'success' : c.status === 'Scheduled' ? 'info' : c.status === 'Completed' ? 'success' : undefined}>{c.status}</Badge>,
              c.roi,
              c.reach,
              c.revenue
            ])}
          />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// --- Team ---
export function TeamTab() {
  const [members, setMembers] = useState([
    { name: "Admin User", email: "admin@store.com", role: "Owner", status: "Active", lastLogin: "Just now" },
    { name: "Support Agent A", email: "agent1@store.com", role: "Agent", status: "Active", lastLogin: "2 hours ago" },
    { name: "Marketing Lead", email: "marketing@store.com", role: "Manager", status: "Away", lastLogin: "1 day ago" },
    { name: "Developer B", email: "dev@store.com", role: "Developer", status: "Active", lastLogin: "15 mins ago" },
  ]);

  const handleInvite = () => {
    const email = prompt("Enter email address to invite:");
    if (!email) return;
    setMembers([
      ...members,
      { name: email.split('@')[0], email, role: "Agent", status: "Active", lastLogin: "Never" }
    ]);
    toast.success(`Invitation sent to ${email}`);
  };

  const handleRemove = (index: number) => {
    if (confirm(`Are you sure you want to remove ${members[index].name}?`)) {
      setMembers(members.filter((_, i) => i !== index));
      toast.success("Team member removed");
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineGrid columns="1fr auto">
          <Text as="h2" variant="headingMd">Team Management</Text>
          <Button variant="primary" onClick={handleInvite}>Invite Member</Button>
        </InlineGrid>
        <div className="space-y-4">
          {members.map((m, i) => (
            <Box key={i} padding="400" background="bg-surface-secondary" borderRadius="200" borderStyle="solid" borderColor="border" borderWidth="025">
              <InlineGrid columns="1fr auto" alignItems="center">
                <BlockStack gap="100">
                  <div className="flex items-center gap-2">
                    <Text as="p" variant="bodyMd" fontWeight="bold">{m.name}</Text>
                    <Badge tone={m.status === 'Active' ? 'success' : 'attention'}>{m.status}</Badge>
                  </div>
                  <Text as="p" variant="bodySm" tone="subdued">{m.email} • {m.role} • Last login: {m.lastLogin}</Text>
                </BlockStack>
                <div className="flex gap-2">
                  <Button variant="tertiary" onClick={() => alert(`Opening permissions for: ${m.name}`)}>Permissions</Button>
                  <Button variant="tertiary" tone="critical" onClick={() => handleRemove(i)}>Remove</Button>
                </div>
              </InlineGrid>
            </Box>
          ))}
        </div>
      </BlockStack>
    </Card>
  );
}

// --- Integrations ---
export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState([
    { name: "Shopify", desc: "Core store data & orders", connected: true, icon: OrderIcon, apiKey: "••••••••••••••••" },
    { name: "Slack", desc: "Real-time handover alerts", connected: false, icon: ConnectIcon, apiKey: "" },
    { name: "Zendesk", desc: "Sync support tickets", connected: false, icon: ConnectIcon, apiKey: "" },
    { name: "Klaviyo", desc: "AI-driven email marketing", connected: true, icon: ConnectIcon, apiKey: "••••••••••••••••" },
    { name: "Mailchimp", desc: "Newsletter sync", connected: false, icon: ConnectIcon, apiKey: "" },
    { name: "Intercom", desc: "Live chat sync", connected: false, icon: ConnectIcon, apiKey: "" },
  ]);

  const handleConnect = (index: number) => {
    const newInts = [...integrations];
    newInts[index].connected = !newInts[index].connected;
    if (newInts[index].connected) {
      newInts[index].apiKey = "••••••••••••••••";
    } else {
      newInts[index].apiKey = "";
    }
    setIntegrations(newInts);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">App Integrations</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((int, i) => (
            <Box key={i} padding="400" background="bg-surface-secondary" borderRadius="200" borderStyle="solid" borderColor="border" borderWidth="025">
              <BlockStack gap="300">
                <InlineGrid columns="auto 1fr" gap="300" alignItems="center">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Icon source={int.icon} />
                  </div>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="bold">{int.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{int.desc}</Text>
                  </BlockStack>
                </InlineGrid>
                {int.connected ? (
                  <TextField
                    label="API Key"
                    value={int.apiKey}
                    type="password"
                    disabled
                    autoComplete="off"
                  />
                ) : (
                  <TextField
                    label="API Key"
                    placeholder="Enter API Key to connect"
                    autoComplete="off"
                  />
                )}
                <div className="flex justify-between items-center">
                  <Badge tone={int.connected ? 'success' : undefined}>{int.connected ? 'Connected' : 'Disconnected'}</Badge>
                  <Button variant="tertiary" onClick={() => handleConnect(i)}>{int.connected ? 'Configure' : 'Connect'}</Button>
                </div>
              </BlockStack>
            </Box>
          ))}
        </div>
      </BlockStack>
    </Card>
  );
}

// --- Notifications ---
export function NotificationsTab() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [frequency, setFrequency] = useState("instant");
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [recipients, setRecipients] = useState("admin@store.com, marketing@store.com");
  const [quotaWarning, setQuotaWarning] = useState(true);
  const [latencyAlert, setLatencyAlert] = useState(false);
  const [latencyThreshold, setLatencyThreshold] = useState(2000);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Notification preferences saved!");
    }, 1000);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Notification Settings</Text>
        <BlockStack gap="400">
          <Box>
            <Text as="h3" variant="headingSm">Human Handover Alerts</Text>
            <Checkbox label="Email notifications" checked={emailNotif} onChange={setEmailNotif} />
            <Checkbox label="Browser push notifications" checked={pushNotif} onChange={setPushNotif} />
            <Checkbox label="Slack channel alerts" checked={slackNotif} onChange={setSlackNotif} />
            <div className="mt-2">
              <Select
                label="Alert Frequency"
                options={[
                  { label: 'Instant', value: 'instant' },
                  { label: 'Batched (every 15m)', value: 'batched' },
                  { label: 'Daily Digest', value: 'daily' },
                ]}
                value={frequency}
                onChange={setFrequency}
              />
            </div>
          </Box>
          <Divider />
          <Box>
            <Text as="h3" variant="headingSm">Performance Reports</Text>
            <Checkbox label="Daily summary email" checked={dailySummary} onChange={setDailySummary} />
            <Checkbox label="Weekly AI insights report" checked={weeklyReport} onChange={setWeeklyReport} />
            <div className="mt-2">
              <TextField
                label="Report Recipients"
                placeholder="admin@store.com, marketing@store.com"
                autoComplete="off"
                value={recipients}
                onChange={setRecipients}
              />
            </div>
          </Box>
          <Divider />
          <Box>
            <Text as="h3" variant="headingSm">System Alerts</Text>
            <Checkbox label="API quota warnings" checked={quotaWarning} onChange={setQuotaWarning} />
            <Checkbox label="Model latency alerts" checked={latencyAlert} onChange={setLatencyAlert} />
            <RangeSlider
              label="Latency Threshold (ms)"
              value={latencyThreshold}
              min={500}
              max={5000}
              step={100}
              onChange={(val) => setLatencyThreshold(Number(val))}
              output
            />
          </Box>
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Save Preferences</Button>
          </div>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

// --- System Logs ---
export function SystemLogsTab() {
  const [searchValue, setSearchValue] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [logs, setLogs] = useState([
    { time: '2024-03-21 09:15:02', level: 'INFO', module: 'AI_ENGINE', msg: 'Gemini 3.1 Pro response generated in 1.2s' },
    { time: '2024-03-21 09:14:45', level: 'WARN', module: 'SHOPIFY_API', msg: 'Rate limit approaching (85%)' },
    { time: '2024-03-21 09:12:10', level: 'ERROR', module: 'WEBHOOK', msg: 'Failed to process order.updated for #1025' },
    { time: '2024-03-21 09:10:00', level: 'INFO', module: 'AUTH', msg: 'Admin login successful' },
    { time: '2024-03-21 09:08:15', level: 'DEBUG', module: 'WIDGET', msg: 'Chat popup opened by user' },
    { time: '2024-03-21 09:05:30', level: 'INFO', module: 'AI_ENGINE', msg: 'Tool call: searchProducts { query: "leather bag" }' },
  ]);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all system logs?")) {
      setLogs([]);
      toast.success("Logs cleared");
    }
  };

  const handleDownload = () => {
    toast.success("Generating CSV download...");
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.msg.toLowerCase().includes(searchValue.toLowerCase()) || l.module.toLowerCase().includes(searchValue.toLowerCase());
    const matchesLevel = levelFilter === "all" || l.level.toLowerCase() === levelFilter.toLowerCase();
    const matchesModule = moduleFilter === "all" || l.module.toLowerCase().includes(moduleFilter.toLowerCase());
    return matchesSearch && matchesLevel && matchesModule;
  });

  return (
    <Card padding="0">
      <Box padding="400" borderBlockEndWidth="025" borderColor="border">
        <BlockStack gap="400">
          <InlineGrid columns="1fr auto" gap="400">
            <Text as="h2" variant="headingMd">Technical System Logs</Text>
            <div className="flex gap-2">
              <Button size="slim" onClick={handleDownload}>Download CSV</Button>
              <Button size="slim" tone="critical" onClick={handleClear}>Clear Logs</Button>
            </div>
          </InlineGrid>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            <TextField 
              label="Search logs" 
              labelHidden 
              prefix={<Icon source={SearchIcon} />} 
              placeholder="Search messages..." 
              autoComplete="off" 
              value={searchValue}
              onChange={setSearchValue}
            />
            <Select
              label="Level"
              labelHidden
              options={[
                { label: 'All Levels', value: 'all' },
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warn' },
                { label: 'Error', value: 'error' },
                { label: 'Debug', value: 'debug' },
              ]}
              value={levelFilter}
              onChange={setLevelFilter}
            />
            <Select
              label="Module"
              labelHidden
              options={[
                { label: 'All Modules', value: 'all' },
                { label: 'AI Engine', value: 'ai' },
                { label: 'Shopify API', value: 'shopify' },
                { label: 'Auth', value: 'auth' },
              ]}
              value={moduleFilter}
              onChange={setModuleFilter}
            />
          </InlineGrid>
        </BlockStack>
      </Box>
      <Scrollable style={{ height: '500px' }}>
        <div className="p-4 font-mono text-xs space-y-2">
          {filteredLogs.map((l, i) => (
            <div key={i} className="flex gap-4 border-b border-gray-50 pb-2 hover:bg-gray-50 transition-colors">
              <span className="text-gray-400 whitespace-nowrap">{l.time}</span>
              <span className={`font-bold w-12 ${l.level === 'ERROR' ? 'text-red-600' : l.level === 'WARN' ? 'text-amber-600' : l.level === 'DEBUG' ? 'text-gray-500' : 'text-blue-600'}`}>[{l.level}]</span>
              <span className="text-purple-600 font-bold w-24">[{l.module}]</span>
              <span className="text-gray-700 flex-1">{l.msg}</span>
            </div>
          ))}
        </div>
      </Scrollable>
    </Card>
  );
}
