"use client";

import { useState, useEffect } from "react";
import { Send, Bell, CheckCircle, XCircle, Clock, RefreshCw, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Headers for ngrok to skip browser warning
const ngrokHeaders = {
    'ngrok-skip-browser-warning': 'true',
};

type Notification = {
    id: string;
    title: string;
    body: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
};

type Device = {
    id: string;
    fcmToken: string;
    deviceId: string;
    platform: string;
    createdAt: string;
};

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [form, setForm] = useState({
        title: "",
        body: "",
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadNotifications = async () => {
        try {
            const res = await fetch(`${API_URL}/notifications`, { headers: ngrokHeaders });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.sort((a: Notification, b: Notification) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            }
        } catch (e) {
            console.error('Failed to load notifications:', e);
        }
    };

    const loadDevices = async () => {
        try {
            const res = await fetch(`${API_URL}/devices`, { headers: ngrokHeaders });
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (e) {
            console.error('Failed to load devices:', e);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoadingHistory(true);
            await Promise.all([loadNotifications(), loadDevices()]);
            setLoadingHistory(false);
        };
        loadData();
    }, []);

    const handleSend = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            showToast('Please fill in title and message', 'error');
            return;
        }

        setLoading(true);
        try {
            // Send push notification via FCM
            const res = await fetch(`${API_URL}/devices/push`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...ngrokHeaders },
                body: JSON.stringify({
                    title: form.title,
                    body: form.body,
                })
            });
            
            const result = await res.json();
            
            if (result.success) {
                showToast(`Notification sent to ${result.successCount} device(s)!`, 'success');
                setForm({ title: "", body: "" });
                // Reload notifications list
                await loadNotifications();
            } else {
                showToast(result.message || 'Failed to send notification', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to send notification', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SENT':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'FAILED':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SENT':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{status}</Badge>;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 ${
                    toast.type === 'success' 
                        ? "bg-gradient-to-r from-primary to-secondary text-white" 
                        : "bg-destructive text-white"
                }`}>
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Push Notifications</h1>
                        <p className="text-sm text-muted-foreground mt-1">Send instant messages to your users via FCM</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                        <span>{devices.length} registered device(s)</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Send Notification Card */}
                    <Card className="gradient-card border-0 shadow-md">
                        <CardHeader className="border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                                    <Bell className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Send Notification</CardTitle>
                                    <CardDescription>
                                        Push to all registered devices
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="font-semibold">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. New Summer Sale!"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="border-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message" className="font-semibold">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Enter your notification body..."
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    className="border-primary/20 focus:border-primary min-h-[120px]"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-primary/10 px-6 py-4">
                            <Button 
                                onClick={handleSend} 
                                disabled={loading || devices.length === 0} 
                                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift"
                            >
                                <Send className="mr-2 h-4 w-4" /> 
                                {loading ? "Sending..." : devices.length === 0 ? "No Devices Registered" : "Send Notification"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Notification History Card */}
                    <Card className="gradient-card border-0 shadow-md">
                        <CardHeader className="border-b border-primary/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-md">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">History</CardTitle>
                                        <CardDescription>
                                            Recently sent notifications
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={loadNotifications}
                                    disabled={loadingHistory}
                                >
                                    <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[320px]">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center h-full py-12">
                                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                                        <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">No notifications sent yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {notifications.slice(0, 5).map((notif) => (
                                            <div key={notif.id} className="p-4 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        {getStatusIcon(notif.status)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{notif.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{notif.body}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {getStatusBadge(notif.status)}
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDate(notif.sentAt || notif.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Registered Devices */}
                {devices.length > 0 && (
                    <Card className="gradient-card border-0 shadow-md">
                        <CardHeader className="border-b border-primary/10 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Registered Devices ({devices.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="max-h-[200px]">
                                <div className="divide-y">
                                    {devices.map((device) => (
                                        <div key={device.id} className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">
                                                    {device.platform === "android" ? "Android" : "iOS"}
                                                </Badge>
                                                <span className="text-sm font-mono text-muted-foreground">
                                                    {device.deviceId.substring(0, 16)}...
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(device.createdAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
