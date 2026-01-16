"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://unleached-paulette-noctilucent.ngrok-free.dev";

// Headers for ngrok to skip browser warning
const ngrokHeaders = {
    'ngrok-skip-browser-warning': 'true',
};

export default function ContentPage() {
    const [contents, setContents] = useState<any[]>([]);

    console.log(contents);

    useEffect(() => {
        fetch(`${API_URL}/content`, { headers: ngrokHeaders })
            .then((res) => res.json())
            .then((data) => setContents(data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Content & Media</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your images, videos, and media assets</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift">
                    <Plus className="mr-2 h-4 w-4" /> Upload New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contents.length === 0 && (
                    <div className="col-span-3 text-center py-20 gradient-card border-2 border-dashed border-primary/20 rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-muted-foreground font-medium">No content items found</p>
                            <p className="text-sm text-muted-foreground">Upload your first media file to get started</p>
                        </div>
                    </div>
                )}
                {contents?.map?.((item) => (
                    <Card key={item.id} className="overflow-hidden gradient-card border-0 shadow-md hover-lift cursor-pointer">
                        <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center relative overflow-hidden">
                            {item.type === 'image' && item.url ? (
                                <img src={item.url} alt={item.title} className="object-cover w-full h-full" />
                            ) : (
                                <FileText className="h-10 w-10 text-primary/50" />
                            )}
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-sm">
                                    {item.type || 'media'}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-semibold truncate">{item.title}</h3>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {item.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-primary/10 text-primary border-0">{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {/* Mock items for design if empty */}
                {contents.length === 0 && (
                    <>
                        <Card className="overflow-hidden gradient-card border-0 shadow-md opacity-60">
                            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-primary/40" />
                            </div>
                            <CardContent className="p-4">
                                <div className="h-4 w-3/4 bg-primary/10 rounded mb-2"></div>
                                <div className="flex gap-2">
                                    <div className="h-4 w-12 bg-primary/10 rounded"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
