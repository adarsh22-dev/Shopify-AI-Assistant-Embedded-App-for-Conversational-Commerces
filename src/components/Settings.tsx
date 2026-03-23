import React, { useState, useEffect } from "react";
import { Card, Text, BlockStack, TextField, Button, Banner, Box, Divider } from "@shopify/polaris";
import { toast } from "react-hot-toast";

interface SettingsProps {
  adminPassword?: string;
  shopName?: string;
}

export function Settings({ adminPassword, shopName }: SettingsProps) {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#008060");
  const [accentColor, setAccentColor] = useState("#000000");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [chatPosition, setChatPosition] = useState("bottom-right");
  const [quickActionsEnabled, setQuickActionsEnabled] = useState(true);
  const [abandonmentNudgeEnabled, setAbandonmentNudgeEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { "x-admin-key": adminPassword || "" }
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSystemPrompt(data.systemPrompt || "");
      setWelcomeMessage(data.welcomeMessage || "");
      setStoreName(data.storeName || "");
      setStoreDescription(data.storeDescription || "");
      setSupportEmail(data.supportEmail || "");
      setPrimaryColor(data.primaryColor || "#008060");
      setAccentColor(data.accentColor || "#000000");
      setFontFamily(data.fontFamily || "Inter");
      setChatPosition(data.chatPosition || "bottom-right");
      setQuickActionsEnabled(data.quickActionsEnabled ?? true);
      setAbandonmentNudgeEnabled(data.abandonmentNudgeEnabled ?? true);
    } catch (error) {
      console.error("Failed to fetch settings", error);
      toast.error("Failed to load settings.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminPassword || "" 
        },
        body: JSON.stringify({ 
          systemPrompt, 
          welcomeMessage, 
          storeName,
          storeDescription,
          supportEmail,
          primaryColor,
          accentColor,
          fontFamily,
          chatPosition,
          quickActionsEnabled, 
          abandonmentNudgeEnabled 
        }),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      setShowBanner(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setShowBanner(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BlockStack gap="500">
      {showBanner && (
        <Banner title="Settings saved successfully" tone="success" onDismiss={() => setShowBanner(false)} />
      )}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            AI Configuration
          </Text>
          <Text as="p" tone="subdued">
            Customize how your AI Assistant interacts with customers.
          </Text>
          
          <TextField
            label="System Instruction"
            value={systemPrompt}
            onChange={setSystemPrompt}
            multiline={4}
            autoComplete="off"
            helpText="This defines the personality and rules for your AI Assistant."
          />

          <TextField
            label="Welcome Message"
            value={welcomeMessage}
            onChange={setWelcomeMessage}
            autoComplete="off"
            helpText="The first message customers see when they open the chat."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Store Display Name"
              value={storeName}
              onChange={setStoreName}
              autoComplete="off"
              helpText="The name of your store as it appears in the chat."
            />
            <TextField
              label="Support Email"
              value={supportEmail}
              onChange={setSupportEmail}
              autoComplete="off"
              helpText="Email address for customer support inquiries."
            />
          </div>

          <TextField
            label="Store Description"
            value={storeDescription}
            onChange={setStoreDescription}
            multiline={2}
            autoComplete="off"
            helpText="A brief description of your store for the AI's context."
          />

          <Divider />

          <Text as="h2" variant="headingMd">
            Chat Widget Customization
          </Text>
          <Text as="p" tone="subdued">
            Personalize the look and feel of your storefront chat widget.
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Primary Color"
              value={primaryColor}
              onChange={setPrimaryColor}
              autoComplete="off"
              helpText="The main color of the chat bubble and header (hex code)."
              prefix={<div style={{ width: '20px', height: '20px', backgroundColor: primaryColor, borderRadius: '4px', border: '1px solid #ddd' }} />}
            />
            <TextField
              label="Accent Color"
              value={accentColor}
              onChange={setAccentColor}
              autoComplete="off"
              helpText="Used for buttons and highlights."
              prefix={<div style={{ width: '20px', height: '20px', backgroundColor: accentColor, borderRadius: '4px', border: '1px solid #ddd' }} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Font Family"
              value={fontFamily}
              onChange={setFontFamily}
              autoComplete="off"
              helpText="e.g. Inter, Roboto, sans-serif"
            />
            <div className="space-y-2">
              <Text as="p" variant="bodyMd">Chat Position</Text>
              <select 
                value={chatPosition} 
                onChange={e => setChatPosition(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#008060] focus:border-transparent outline-none"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Text as="p" fontWeight="bold">Quick Actions</Text>
                <Text as="p" variant="bodySm" tone="subdued">Show suggested buttons in the chat widget.</Text>
              </div>
              <input 
                type="checkbox" 
                checked={quickActionsEnabled} 
                onChange={e => setQuickActionsEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#008060] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Text as="p" fontWeight="bold">Cart Abandonment Nudge</Text>
                <Text as="p" variant="bodySm" tone="subdued">Proactively message customers who leave items in their cart.</Text>
              </div>
              <input 
                type="checkbox" 
                checked={abandonmentNudgeEnabled} 
                onChange={e => setAbandonmentNudgeEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#008060] cursor-pointer"
              />
            </div>
          </div>

          <Box paddingBlockStart="200">
            <Button variant="primary" onClick={handleSave} loading={isSaving}>
              Save Settings
            </Button>
          </Box>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Store Information
          </Text>
          <Text as="p" tone="subdued">
            Current Shopify connection details.
          </Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="bold">Store Name</Text>
              <Text as="p" variant="bodySm">{shopName || "Not set"}</Text>
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
