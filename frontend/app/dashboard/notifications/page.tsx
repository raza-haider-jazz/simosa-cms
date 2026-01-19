"use client";

import { useState } from "react";
import { Send, Bell } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Headers for ngrok to skip browser warning
const ngrokHeaders = {
    'ngrok-skip-browser-warning': 'true',
};

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        body: "",
        targetType: "all",
    });

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...ngrokHeaders },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert("Notification Sent!");
                setForm({ title: "", body: "", targetType: "all" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Push Notifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">Send instant messages to your users</p>
                </div>
            </div>

            <Card className="gradient-card border-0 shadow-md">
                <CardHeader className="border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                            <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Send Notification</CardTitle>
                            <CardDescription>
                                Broadcast a message to your users' devices.
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
                    <div className="grid gap-2">
                        <Label htmlFor="target" className="font-semibold">Target Audience</Label>
                        <Select
                            value={form.targetType}
                            onValueChange={(val) => setForm({ ...form, targetType: val })}
                        >
                            <SelectTrigger id="target" className="border-primary/20">
                                <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent className="gradient-card border-primary/20">
                                <SelectItem value="all" className="hover:bg-primary/10">All Users</SelectItem>
                                <SelectItem value="segment" className="hover:bg-primary/10">Specific Segment</SelectItem>
                                <SelectItem value="specific" className="hover:bg-primary/10">Specific User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t border-primary/10 px-6 py-4">
                    <Button 
                        onClick={handleSend} 
                        disabled={loading} 
                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift"
                    >
                        <Send className="mr-2 h-4 w-4" /> 
                        {loading ? "Sending..." : "Send Notification"}
                    </Button>
                </CardFooter>
            </Card>

            <div className="gradient-card rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-secondary/50 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">Recent Notifications</h3>
                <p className="text-sm text-muted-foreground">History of sent notifications will appear here.</p>
            </div>
        </div>
    );
}
