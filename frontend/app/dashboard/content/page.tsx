"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
    const [contents, setContents] = useState<any[]>([]);

    console.log(contents);

    useEffect(() => {
        fetch("http://localhost:4000/content")
            .then((res) => res.json())
            .then((data) => setContents(data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Content & Media</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Upload New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contents.length === 0 && (
                    <div className="col-span-3 text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No content items found</p>
                    </div>
                )}
                {contents?.map?.((item) => (
                    <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                            {item.type === 'image' && item.url ? (
                                <img src={item.url} alt={item.title} className="object-cover w-full h-full" />
                            ) : (
                                <FileText className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-semibold truncate">{item.title}</h3>
                            <div className="flex gap-2 mt-2">
                                {item.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {/* Mock items for design if empty */}
                {contents.length === 0 && (
                    <>
                        <Card className="overflow-hidden opacity-60">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <CardContent className="p-4">
                                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                                <div className="flex gap-2">
                                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
