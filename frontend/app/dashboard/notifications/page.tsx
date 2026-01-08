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
            const res = await fetch("http://localhost:4000/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Push Notifications</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Send Notification</CardTitle>
                    <CardDescription>
                        Broadcast a message to your users' devices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. New Summer Sale!"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Enter your notification body..."
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="target">Target Audience</Label>
                        <Select
                            value={form.targetType}
                            onValueChange={(val) => setForm({ ...form, targetType: val })}
                        >
                            <SelectTrigger id="target">
                                <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="segment">Specific Segment</SelectItem>
                                <SelectItem value="specific">Specific User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSend} disabled={loading} className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" /> Send Notification
                    </Button>
                </CardFooter>
            </Card>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
                <Bell className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">Recent Notifications</h3>
                <p className="text-sm text-muted-foreground">History of sent notifications will appear here.</p>
            </div>
        </div>
    );
}
