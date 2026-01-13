"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
    GripVertical,
    Plus,
    Trash2,
    Settings2,
    Image as ImageIcon,
    LayoutGrid,
    List,
    Type,
    Upload,
    X,
    Save,
    Loader2,
    Layers,
    ChevronLeft,
    ChevronRight,
    Eye,
    CreditCard,
    Smartphone,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Only PRE_PAID and POST_PAID - no ALL option
type UserType = "PRE_PAID" | "POST_PAID";

type GridItemContent = {
    id: string;
    iconUrl: string;
    title: string;
    subtitle: string;
    ctaUrl: string;
    showNewTag?: boolean;
};

type CarouselCard = {
    id: string;
    order: number;
    imageUrl: string;
    title: string;
    subtitle: string;
    description: string;
    price: number | null;
    currency: string;
    ctaText: string;
    ctaAction: string;
    ctaUrl: string;
    backgroundColor: string;
    textColor: string;
};

type SectionBanner = {
    id: string;
    order: number;
    imageUrl: string;
    label: string;
    title: string;
    tag: string;
    ctaUrl: string;
};

type GridItem = {
    id: string;
    title: string;
    type: "banner" | "list" | "html" | "grid" | "carousel" | "horizontal-list" | "section";
    columns: number;
    displayMode: "list" | "grid";
    showNewTag: boolean;
    images: string[];
    htmlContent?: string;
    order: number;
    userType: UserType;
    config?: any;
    isNew?: boolean;
    carouselId?: string;
    carouselCards?: CarouselCard[];
    autoPlay?: boolean;
    interval?: number;
    gridItems?: GridItemContent[];
    // Section-specific fields
    sectionBanners?: SectionBanner[];
    backgroundColor?: string;
    // Track original card IDs for deletion
    originalCardIds?: string[];
};

const emptyCard: CarouselCard = {
    id: "",
    order: 0,
    imageUrl: "",
    title: "",
    subtitle: "",
    description: "",
    price: null,
    currency: "PKR",
    ctaText: "",
    ctaAction: "navigate",
    ctaUrl: "",
    backgroundColor: "#1a365d",
    textColor: "#ffffff",
};

const emptyGridItem: GridItemContent = {
    id: "",
    iconUrl: "",
    title: "",
    subtitle: "",
    ctaUrl: "",
    showNewTag: false,
};

const emptySectionBanner: SectionBanner = {
    id: "",
    order: 0,
    imageUrl: "",
    label: "",
    title: "",
    tag: "",
    ctaUrl: "",
};

const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Upload a file and get back a URL
const uploadFile = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL_BASE}/upload/file`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Upload success:', data);
        return data.url; // Returns something like "/uploads/abc123.jpg"
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

// Convert base64 to file URL (for backward compatibility with existing data)
const uploadBase64 = async (dataUrl: string): Promise<string> => {
    if (!dataUrl.startsWith('data:')) {
        return dataUrl; // Already a URL
    }
    
    const response = await fetch(`${API_URL_BASE}/upload/base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
    });
    
    if (!response.ok) {
        throw new Error('Failed to upload base64 image');
    }
    
    const data = await response.json();
    return data.url;
};

// Get the full URL for an image path
const getImageUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('data:')) return path; // Still base64 (not yet saved)
    if (path.startsWith('http')) return path; // Already full URL
    if (path.startsWith('/uploads')) return `${API_URL_BASE}${path}`;
    return path;
};

// Sanitize image value to ensure it's a string (not empty object)
const sanitizeImageValue = (value: any): string => {
    if (!value || typeof value !== 'string') return '';
    return value;
};

function SortableItem({
    item,
    onRemove,
    onEdit
}: {
    item: GridItem;
    onRemove: (id: string) => void;
    onEdit: (item: GridItem) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const typeIcon = {
        banner: <ImageIcon className="h-4 w-4" />,
        grid: <LayoutGrid className="h-4 w-4" />,
        list: <List className="h-4 w-4" />,
        html: <Type className="h-4 w-4" />,
        carousel: <Layers className="h-4 w-4" />,
        "horizontal-list": <List className="h-4 w-4" />,
        section: <Package className="h-4 w-4" />,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm group",
                isDragging && "opacity-50",
                item.isNew && "border-dashed border-yellow-400",
                item.type === "carousel" && "border-l-4 border-l-purple-500",
                item.type === "grid" && "border-l-4 border-l-orange-500"
            )}
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {typeIcon[item.type]}
                    <span className="font-medium">{item.title}</span>
                    {item.isNew && <Badge variant="outline" className="text-[10px] h-5 px-1 bg-yellow-50 text-yellow-700">UNSAVED</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase mt-1">
                    <Badge variant="outline" className="text-[10px] h-5">{item.type}</Badge>
                    {item.type === 'carousel' && item.carouselCards && (
                        <span>{item.carouselCards.length} Cards</span>
                    )}
                    {item.type === 'grid' && (
                        <>
                            <span>{item.columns} Cols</span>
                            {item.gridItems && <span>{item.gridItems.length} Items</span>}
                        </>
                    )}
                    {item.type === 'section' && (
                        <>
                            {item.gridItems && <span>{item.gridItems.length} Grid Items</span>}
                            {item.sectionBanners && <span>{item.sectionBanners.length} Banners</span>}
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Settings2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Carousel Card Editor
function CarouselCardEditor({
    card,
    index,
    onChange,
    onRemove,
}: {
    card: CarouselCard;
    index: number;
    onChange: (card: CarouselCard) => void;
    onRemove: () => void;
}) {
    const [uploading, setUploading] = React.useState(false);
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                console.log('Uploading carousel image:', e.target.files[0].name);
                const url = await uploadFile(e.target.files[0]);
                console.log('Carousel upload result:', url, 'Type:', typeof url);
                onChange({ ...card, imageUrl: url });
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Card {index + 1}</h4>
                <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive h-8">
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Label className="text-xs">Card Image</Label>
                    <div className="flex gap-2 mt-1">
                        {card.imageUrl ? (
                            <div className="relative w-24 h-16 border rounded overflow-hidden flex-shrink-0">
                                <img src={getImageUrl(card.imageUrl)} className="w-full h-full object-cover" alt="" />
                                <button onClick={() => onChange({ ...card, imageUrl: "" })} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <label className={`w-24 h-16 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}>
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-[9px] text-muted-foreground mt-1">Upload</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                        <Input
                            value={card.imageUrl.startsWith('/uploads') ? '' : card.imageUrl}
                            onChange={(e) => onChange({ ...card, imageUrl: e.target.value })}
                            placeholder="Or paste image URL..."
                            className="h-8 text-sm flex-1"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} placeholder="Card title" className="h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Subtitle</Label>
                    <Input value={card.subtitle} onChange={(e) => onChange({ ...card, subtitle: e.target.value })} placeholder="Subtitle" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={card.description} onChange={(e) => onChange({ ...card, description: e.target.value })} placeholder="Card description" className="text-sm min-h-[60px]" />
                </div>
                <div>
                    <Label className="text-xs">Price</Label>
                    <Input type="number" value={card.price || ""} onChange={(e) => onChange({ ...card, price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="0.00" className="h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Currency</Label>
                    <Select value={card.currency} onValueChange={(v) => onChange({ ...card, currency: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PKR">PKR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">CTA Text</Label>
                    <Input value={card.ctaText} onChange={(e) => onChange({ ...card, ctaText: e.target.value })} placeholder="Learn More" className="h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">CTA Action</Label>
                    <Select value={card.ctaAction} onValueChange={(v) => onChange({ ...card, ctaAction: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="navigate">Navigate</SelectItem>
                            <SelectItem value="deeplink">Deeplink</SelectItem>
                            <SelectItem value="webview">Webview</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">CTA URL</Label>
                    <Input value={card.ctaUrl} onChange={(e) => onChange({ ...card, ctaUrl: e.target.value })} placeholder="/path or https://..." className="h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Background Color</Label>
                    <div className="flex gap-2">
                        <Input type="color" value={card.backgroundColor} onChange={(e) => onChange({ ...card, backgroundColor: e.target.value })} className="h-8 w-12 p-1" />
                        <Input value={card.backgroundColor} onChange={(e) => onChange({ ...card, backgroundColor: e.target.value })} className="h-8 text-sm flex-1" />
                    </div>
                </div>
                <div>
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex gap-2">
                        <Input type="color" value={card.textColor} onChange={(e) => onChange({ ...card, textColor: e.target.value })} className="h-8 w-12 p-1" />
                        <Input value={card.textColor} onChange={(e) => onChange({ ...card, textColor: e.target.value })} className="h-8 text-sm flex-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Grid Item Editor (for items inside a grid)
function GridItemEditor({
    item,
    index,
    onChange,
    onRemove,
}: {
    item: GridItemContent;
    index: number;
    onChange: (item: GridItemContent) => void;
    onRemove: () => void;
}) {
    const [uploading, setUploading] = React.useState(false);
    
    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                console.log('Uploading grid icon:', e.target.files[0].name);
                const url = await uploadFile(e.target.files[0]);
                console.log('Grid icon upload result:', url, 'Type:', typeof url);
                onChange({ ...item, iconUrl: url });
            } catch (error) {
                console.error('Failed to upload icon:', error);
                alert(`Failed to upload icon: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" /> Item {index + 1}
                </h4>
                <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive h-7">
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {/* Icon for circular display */}
                <div className="col-span-2">
                    <Label className="text-xs">Icon (Circular Display)</Label>
                    <div className="flex gap-2 mt-1">
                        {item.iconUrl ? (
                            <div className="relative w-12 h-12 border rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                                <img src={getImageUrl(item.iconUrl)} className="w-full h-full object-contain p-1" alt="" />
                                <button onClick={() => onChange({ ...item, iconUrl: "" })} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full">
                                    <X className="h-2 w-2" />
                                </button>
                            </div>
                        ) : (
                            <label className={`w-12 h-12 border border-dashed rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}>
                                {uploading ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                ) : (
                                    <Upload className="h-3 w-3 text-muted-foreground" />
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploading} />
                            </label>
                        )}
                        <Input
                            value={(item.iconUrl || '').startsWith('/uploads') ? '' : (item.iconUrl || '')}
                            onChange={(e) => onChange({ ...item, iconUrl: e.target.value })}
                            placeholder="Icon URL"
                            className="h-8 text-sm flex-1"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Title" className="h-7 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Subtitle</Label>
                    <Input value={item.subtitle} onChange={(e) => onChange({ ...item, subtitle: e.target.value })} placeholder="Subtitle" className="h-7 text-sm" />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">Link URL</Label>
                    <Input value={item.ctaUrl} onChange={(e) => onChange({ ...item, ctaUrl: e.target.value })} placeholder="/path" className="h-7 text-sm" />
                </div>
                <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id={`new-tag-${item.id}`}
                            checked={item.showNewTag || false} 
                            onCheckedChange={(checked) => onChange({ ...item, showNewTag: checked })} 
                        />
                        <Label htmlFor={`new-tag-${item.id}`} className="text-xs">Show HOT Tag</Label>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Banner Editor Component
function BannerEditor({
    editingItem,
    setEditingItem,
}: {
    editingItem: GridItem;
    setEditingItem: (item: GridItem) => void;
}) {
    const [uploading, setUploading] = React.useState(false);
    
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                console.log('Uploading banner file:', e.target.files[0].name);
                const url = await uploadFile(e.target.files[0]);
                console.log('Banner upload result:', url, 'Type:', typeof url);
                setEditingItem({ ...editingItem, images: [url] });
            } catch (error) {
                console.error('Failed to upload banner:', error);
                alert(`Failed to upload banner: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Title</Label>
                <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Banner Image</Label>
                <div className="col-span-3 space-y-2">
                    {editingItem.images?.[0] ? (
                        <div className="relative w-full aspect-[2/1] border rounded overflow-hidden">
                            <img src={getImageUrl(editingItem.images[0])} className="w-full h-full object-cover" alt="" />
                            <button 
                                onClick={() => setEditingItem({ ...editingItem, images: [] })} 
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className={`w-full aspect-[2/1] border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 ${uploading ? 'opacity-50' : ''}`}>
                            {uploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                            ) : (
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {uploading ? 'Uploading...' : 'Click to upload banner image'}
                            </span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleBannerUpload}
                                disabled={uploading}
                            />
                        </label>
                    )}
                    <Input 
                        value={(editingItem.images?.[0] || '').startsWith('/uploads') ? '' : (editingItem.images?.[0] || '')} 
                        onChange={(e) => setEditingItem({ ...editingItem, images: [e.target.value] })} 
                        placeholder="Or paste image URL..." 
                        className="h-8 text-sm" 
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">NEW Tag</Label>
                <div className="flex items-center space-x-2 col-span-3">
                    <Switch checked={editingItem.showNewTag || false} onCheckedChange={(checked) => setEditingItem({ ...editingItem, showNewTag: checked })} />
                    <Label>Show NEW badge</Label>
                </div>
            </div>
        </div>
    );
}

// Section Banner Editor (for banners within a section)
function SectionBannerEditor({
    banner,
    index,
    onChange,
    onRemove,
}: {
    banner: SectionBanner;
    index: number;
    onChange: (banner: SectionBanner) => void;
    onRemove: () => void;
}) {
    const [uploading, setUploading] = React.useState(false);
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                console.log('Uploading section banner image:', e.target.files[0].name);
                const url = await uploadFile(e.target.files[0]);
                console.log('Section banner upload result:', url);
                onChange({ ...banner, imageUrl: url });
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Banner {index + 1}</h4>
                <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive h-8">
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Label className="text-xs">Banner Image</Label>
                    <div className="flex gap-2 mt-1">
                        {banner.imageUrl ? (
                            <div className="relative w-32 h-20 border rounded overflow-hidden flex-shrink-0">
                                <img src={getImageUrl(banner.imageUrl)} className="w-full h-full object-cover" alt="" />
                                <button onClick={() => onChange({ ...banner, imageUrl: "" })} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <label className={`w-32 h-20 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}>
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-[9px] text-muted-foreground mt-1">Upload</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                        <Input
                            value={banner.imageUrl.startsWith('/uploads') ? '' : banner.imageUrl}
                            onChange={(e) => onChange({ ...banner, imageUrl: e.target.value })}
                            placeholder="Or paste URL..."
                            className="h-8 text-sm flex-1"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={banner.label} onChange={(e) => onChange({ ...banner, label: e.target.value })} placeholder="TRENDING" className="h-8 text-sm" />
                </div>
                <div>
                    <Label className="text-xs">Title (Bold)</Label>
                    <Input value={banner.title} onChange={(e) => onChange({ ...banner, title: e.target.value })} placeholder="Main Title" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">Tag (Small)</Label>
                    <Input value={banner.tag} onChange={(e) => onChange({ ...banner, tag: e.target.value })} placeholder="Subtitle" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">CTA URL</Label>
                    <Input value={banner.ctaUrl} onChange={(e) => onChange({ ...banner, ctaUrl: e.target.value })} placeholder="/path or https://..." className="h-8 text-sm" />
                </div>
            </div>
        </div>
    );
}

// Section Editor Component
function SectionEditor({
    editingItem,
    setEditingItem,
}: {
    editingItem: GridItem;
    setEditingItem: (item: GridItem) => void;
}) {
    const addSectionBanner = () => {
        const newBanner: SectionBanner = {
            ...emptySectionBanner,
            id: `temp-section-banner-${Date.now()}`,
            order: editingItem.sectionBanners?.length || 0,
        };
        setEditingItem({ ...editingItem, sectionBanners: [...(editingItem.sectionBanners || []), newBanner] });
    };

    const updateSectionBanner = (index: number, banner: SectionBanner) => {
        if (editingItem.sectionBanners) {
            const newBanners = [...editingItem.sectionBanners];
            newBanners[index] = banner;
            setEditingItem({ ...editingItem, sectionBanners: newBanners });
        }
    };

    const removeSectionBanner = (index: number) => {
        if (editingItem.sectionBanners) {
            const newBanners = [...editingItem.sectionBanners];
            newBanners.splice(index, 1);
            setEditingItem({ ...editingItem, sectionBanners: newBanners });
        }
    };

    const addGridItem = () => {
        const newGridItem: GridItemContent = {
            ...emptyGridItem,
            id: `temp-section-grid-${Date.now()}`,
        };
        setEditingItem({ ...editingItem, gridItems: [...(editingItem.gridItems || []), newGridItem] });
    };

    const updateGridItem = (index: number, item: GridItemContent) => {
        if (editingItem.gridItems) {
            const newItems = [...editingItem.gridItems];
            newItems[index] = item;
            setEditingItem({ ...editingItem, gridItems: newItems });
        }
    };

    const removeGridItem = (index: number) => {
        if (editingItem.gridItems) {
            const newItems = [...editingItem.gridItems];
            newItems.splice(index, 1);
            setEditingItem({ ...editingItem, gridItems: newItems });
        }
    };

    return (
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="grid">Grid Items</TabsTrigger>
                <TabsTrigger value="banners">Banners</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Section Title</Label>
                    <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="LIFESTYLE" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Background Color</Label>
                    <div className="col-span-3 flex gap-2">
                        <Input type="color" value={editingItem.backgroundColor || '#1a1a2e'} onChange={(e) => setEditingItem({ ...editingItem, backgroundColor: e.target.value })} className="w-20 h-10 p-1" />
                        <Input value={editingItem.backgroundColor || '#1a1a2e'} onChange={(e) => setEditingItem({ ...editingItem, backgroundColor: e.target.value })} placeholder="#1a1a2e" className="flex-1" />
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Grid Columns</Label>
                    <div className="col-span-3">
                        <Slider value={[editingItem.columns]} onValueChange={(v) => setEditingItem({ ...editingItem, columns: v[0] })} min={2} max={6} step={1} className="flex-1" />
                        <span className="text-sm text-muted-foreground ml-2">{editingItem.columns} columns</span>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="grid" className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Section Grid Items</h3>
                    <Button onClick={addGridItem} size="sm">
                        <Plus className="h-3 w-3 mr-1" /> Add Grid Item
                    </Button>
                </div>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                        {editingItem.gridItems?.map((item, index) => (
                            <GridItemEditor
                                key={item.id}
                                item={item}
                                index={index}
                                onChange={(updated) => updateGridItem(index, updated)}
                                onRemove={() => removeGridItem(index)}
                            />
                        ))}
                        {(!editingItem.gridItems || editingItem.gridItems.length === 0) && (
                            <div className="text-center text-muted-foreground py-8">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No grid items yet</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>

            <TabsContent value="banners" className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Section Banners (Swipeable)</h3>
                    <Button onClick={addSectionBanner} size="sm">
                        <Plus className="h-3 w-3 mr-1" /> Add Banner
                    </Button>
                </div>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                        {editingItem.sectionBanners?.map((banner, index) => (
                            <SectionBannerEditor
                                key={banner.id}
                                banner={banner}
                                index={index}
                                onChange={(updated) => updateSectionBanner(index, updated)}
                                onRemove={() => removeSectionBanner(index)}
                            />
                        ))}
                        {(!editingItem.sectionBanners || editingItem.sectionBanners.length === 0) && (
                            <div className="text-center text-muted-foreground py-8">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No banners yet</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
}

export default function GridPage() {
    const [prePaidItems, setPrePaidItems] = useState<GridItem[]>([]);
    const [postPaidItems, setPostPaidItems] = useState<GridItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<GridItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [screenId, setScreenId] = useState<string | null>(null);
    const [previewCardIndex, setPreviewCardIndex] = useState<{ [key: string]: number }>({});
    
    // Current view/edit tab
    const [activeUserType, setActiveUserType] = useState<UserType>("PRE_PAID");
    // Preview user type
    const [previewUserType, setPreviewUserType] = useState<UserType>("PRE_PAID");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Get items for current active tab
    const currentItems = activeUserType === "PRE_PAID" ? prePaidItems : postPaidItems;
    const setCurrentItems = activeUserType === "PRE_PAID" ? setPrePaidItems : setPostPaidItems;

    // Get items for preview
    const previewItems = previewUserType === "PRE_PAID" ? prePaidItems : postPaidItems;

    useEffect(() => { loadGridItems(); }, []);

    const loadGridItems = async () => {
        setLoading(true);
        try {
            const screenRes = await fetch(`${API_URL}/screens/slug/dashboard`);
            if (screenRes.ok) {
                const screen = await screenRes.json();
                setScreenId(screen.id);
            } else {
                const createRes = await fetch(`${API_URL}/screens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: 'dashboard', name: 'Dashboard', description: 'Main dashboard screen' })
                });
                if (createRes.ok) {
                    const screen = await createRes.json();
                    setScreenId(screen.id);
                }
            }

            const res = await fetch(`${API_URL}/grid`);
            if (res.ok) {
                const data = await res.json();
                const mappedItems: GridItem[] = data.map((item: any) => {
                    // Get original card IDs to track deletions later
                    const originalCardIds = item.carousel?.cards?.map((c: any) => c.id) || [];
                    
                    return {
                        id: item.id,
                        title: item.title,
                        type: item.type,
                        columns: item.config?.columns || 2,
                        displayMode: item.config?.displayMode || "grid",
                        showNewTag: item.config?.showNewTag || false,
                        // Sanitize images on load - filter out any non-strings
                        images: (item.config?.images || []).map(sanitizeImageValue).filter(Boolean),
                        htmlContent: item.config?.htmlContent || "",
                        order: item.order,
                        userType: item.userType === "ALL" ? "PRE_PAID" : item.userType,
                        config: item.config,
                        isNew: false,
                        carouselId: item.carouselId,
                        carouselCards: item.carousel?.cards?.map((c: any) => ({
                            id: c.id,
                            order: c.order,
                            imageUrl: sanitizeImageValue(c.imageUrl),
                            title: c.title || "",
                            subtitle: c.subtitle || "",
                            description: c.description || "",
                            price: c.price,
                            currency: c.currency || "PKR",
                            ctaText: c.ctaText || "",
                            ctaAction: c.ctaAction || "navigate",
                            ctaUrl: c.ctaUrl || "",
                            backgroundColor: c.backgroundColor || "#1a365d",
                            textColor: c.textColor || "#ffffff",
                        })) || [],
                        autoPlay: item.carousel?.autoPlay ?? true,
                        interval: item.carousel?.interval ?? 5000,
                        // Sanitize gridItems iconUrl on load
                        gridItems: (item.config?.gridItems || []).map((gi: any) => ({
                            ...gi,
                            iconUrl: sanitizeImageValue(gi.iconUrl),
                        })),
                        // Section-specific fields
                        sectionBanners: (item.config?.sectionBanners || []).map((sb: any) => ({
                            ...sb,
                            imageUrl: sanitizeImageValue(sb.imageUrl),
                        })),
                        backgroundColor: item.config?.backgroundColor,
                        originalCardIds, // Track for deletion
                    };
                });
                
                // Separate items by user type
                setPrePaidItems(mappedItems.filter(i => i.userType === "PRE_PAID"));
                setPostPaidItems(mappedItems.filter(i => i.userType === "POST_PAID"));
            }
        } catch (error) {
            console.error('Failed to load grid items:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveLayout = async () => {
        setSaving(true);
        try {
            // Combine all items
            const allItems = [...prePaidItems, ...postPaidItems];
            console.log('Saving layout with items:', allItems.length);
            
            const existingRes = await fetch(`${API_URL}/grid`);
            const existingItems = existingRes.ok ? await existingRes.json() : [];
            const existingIds = new Set(existingItems.map((i: any) => i.id));
            console.log('Existing items in DB:', existingItems.length);

            const currentIds = new Set(allItems.filter(i => !i.isNew).map(i => i.id));
            const toDelete = existingItems.filter((i: any) => !currentIds.has(i.id));

            // Delete removed grid features
            for (const item of toDelete) {
                console.log('Deleting grid feature:', item.id);
                await fetch(`${API_URL}/grid/${item.id}`, { method: 'DELETE' });
            }

            // Reorder items per user type
            const prePaidReorder = prePaidItems.filter(i => !i.isNew && existingIds.has(i.id)).map((item, index) => ({ id: item.id, order: index }));
            const postPaidReorder = postPaidItems.filter(i => !i.isNew && existingIds.has(i.id)).map((item, index) => ({ id: item.id, order: index }));
            
            if (prePaidReorder.length > 0 || postPaidReorder.length > 0) {
                await fetch(`${API_URL}/grid/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([...prePaidReorder, ...postPaidReorder])
                });
            }

            // Create new items
            const newItems = allItems.filter(i => i.isNew);
            console.log('New items to create:', newItems.length);
            
            for (const item of newItems) {
                const items = item.userType === "PRE_PAID" ? prePaidItems : postPaidItems;
                const orderIndex = items.findIndex(it => it.id === item.id);
                
                if (item.type === 'carousel') {
                    console.log('Creating carousel:', item.title, 'with', item.carouselCards?.length || 0, 'cards');
                    const payload = {
                        title: item.title,
                        order: orderIndex,
                        userType: item.userType,
                        screenId: screenId,
                        config: { showNewTag: item.showNewTag },
                        carousel: {
                            name: item.title,
                            autoPlay: item.autoPlay ?? true,
                            interval: item.interval ?? 5000,
                            cards: (item.carouselCards || []).map((card, idx) => ({
                                order: idx,
                                imageUrl: sanitizeImageValue(card.imageUrl),
                                title: card.title,
                                subtitle: card.subtitle,
                                description: card.description,
                                price: card.price,
                                currency: card.currency,
                                ctaText: card.ctaText,
                                ctaAction: card.ctaAction,
                                ctaUrl: card.ctaUrl,
                                backgroundColor: card.backgroundColor,
                                textColor: card.textColor,
                                userType: item.userType,
                            }))
                        }
                    };
                    
                    const res = await fetch(`${API_URL}/grid/with-carousel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Failed to create carousel:', res.status, errorText);
                        throw new Error(`Failed to create carousel: ${res.status} ${errorText}`);
                    }
                    
                    const created = await res.json();
                    console.log('Created carousel:', created.id, 'carouselId:', created.carouselId);
                } else if (item.type === 'grid') {
                    console.log('Creating grid:', item.title, 'with', item.gridItems?.length || 0, 'items');
                    const payload = {
                        title: item.title,
                        type: item.type,
                        order: orderIndex,
                        userType: item.userType,
                        screenId: screenId,
                        config: {
                            columns: item.columns,
                            displayMode: item.displayMode,
                            showNewTag: item.showNewTag,
                            images: item.images,
                            htmlContent: item.htmlContent,
                            gridItems: item.gridItems,
                        }
                    };
                    
                    const res = await fetch(`${API_URL}/grid`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Failed to create grid:', res.status, errorText);
                        throw new Error(`Failed to create grid: ${res.status} ${errorText}`);
                    }
                    
                    const created = await res.json();
                    console.log('Created grid:', created.id);
                } else if (item.type === 'section') {
                    console.log('Creating section:', item.title, 'with', item.gridItems?.length || 0, 'grid items and', item.sectionBanners?.length || 0, 'banners');
                    const res = await fetch(`${API_URL}/grid`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: item.title,
                            type: item.type,
                            order: orderIndex,
                            userType: item.userType,
                            screenId: screenId,
                            config: {
                                columns: item.columns,
                                displayMode: item.displayMode,
                                showNewTag: item.showNewTag,
                                backgroundColor: item.backgroundColor,
                                gridItems: (item.gridItems || []).map(gi => ({
                                    ...gi,
                                    iconUrl: sanitizeImageValue(gi.iconUrl)
                                })),
                                sectionBanners: (item.sectionBanners || []).map(sb => ({
                                    ...sb,
                                    imageUrl: sanitizeImageValue(sb.imageUrl)
                                })),
                            }
                        })
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Failed to create section:', res.status, errorText);
                        throw new Error(`Failed to create section: ${res.status} ${errorText}`);
                    }
                    
                    const created = await res.json();
                    console.log('Created section:', created.id);
                } else {
                    console.log('Creating', item.type, ':', item.title);
                    const res = await fetch(`${API_URL}/grid`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: item.title,
                            type: item.type,
                            order: orderIndex,
                            userType: item.userType,
                            screenId: screenId,
                            config: {
                                columns: item.columns,
                                displayMode: item.displayMode,
                                showNewTag: item.showNewTag,
                                images: (item.images || []).map(sanitizeImageValue).filter(Boolean),
                                htmlContent: item.htmlContent,
                                gridItems: (item.gridItems || []).map(gi => ({
                                    ...gi,
                                    iconUrl: sanitizeImageValue(gi.iconUrl)
                                })),
                            }
                        })
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Failed to create item:', res.status, errorText);
                        throw new Error(`Failed to create item: ${res.status} ${errorText}`);
                    }
                }
            }

            // Update existing items
            const existingToUpdate = allItems.filter(i => !i.isNew && existingIds.has(i.id));
            console.log('Existing items to update:', existingToUpdate.length);
            
            for (const item of existingToUpdate) {
                // Update grid feature
                const updateRes = await fetch(`${API_URL}/grid/${item.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: item.title,
                        type: item.type,
                        userType: item.userType,
                        config: {
                            columns: item.columns,
                            displayMode: item.displayMode,
                            showNewTag: item.showNewTag,
                            images: (item.images || []).map(sanitizeImageValue).filter(Boolean),
                            htmlContent: item.htmlContent,
                            backgroundColor: item.backgroundColor,
                            gridItems: (item.gridItems || []).map(gi => ({
                                ...gi,
                                iconUrl: sanitizeImageValue(gi.iconUrl)
                            })),
                            sectionBanners: item.type === 'section' ? (item.sectionBanners || []).map(sb => ({
                                ...sb,
                                imageUrl: sanitizeImageValue(sb.imageUrl)
                            })) : undefined,
                        }
                    })
                });
                
                if (!updateRes.ok) {
                    console.error('Failed to update grid feature:', item.id);
                }

                // Handle carousel updates
                if (item.type === 'carousel' && item.carouselId) {
                    console.log('Updating carousel:', item.carouselId, 'with', item.carouselCards?.length || 0, 'cards');
                    
                    // Update carousel settings
                    await fetch(`${API_URL}/carousel/${item.carouselId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: item.title,
                            autoPlay: item.autoPlay,
                            interval: item.interval,
                            userType: item.userType,
                        })
                    });

                    // Get current card IDs in local state (non-temp)
                    const currentCardIds = new Set(
                        (item.carouselCards || [])
                            .filter(c => c.id && !c.id.startsWith('temp-'))
                            .map(c => c.id)
                    );

                    // Delete cards that were removed (compare with originalCardIds)
                    const originalIds = item.originalCardIds || [];
                    for (const originalId of originalIds) {
                        if (!currentCardIds.has(originalId)) {
                            console.log('Deleting card:', originalId);
                            await fetch(`${API_URL}/carousel/cards/${originalId}`, { method: 'DELETE' });
                        }
                    }

                    // Update or create cards
                    const cards = item.carouselCards || [];
                    for (let idx = 0; idx < cards.length; idx++) {
                        const card = cards[idx];
                        const cardData = {
                            order: idx,
                            imageUrl: sanitizeImageValue(card.imageUrl),
                            title: card.title,
                            subtitle: card.subtitle,
                            description: card.description,
                            price: card.price,
                            currency: card.currency,
                            ctaText: card.ctaText,
                            ctaAction: card.ctaAction,
                            ctaUrl: card.ctaUrl,
                            backgroundColor: card.backgroundColor,
                            textColor: card.textColor,
                            userType: item.userType,
                        };

                        if (card.id && !card.id.startsWith('temp-')) {
                            // Update existing card
                            console.log('Updating card:', card.id);
                            const cardRes = await fetch(`${API_URL}/carousel/cards/${card.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(cardData)
                            });
                            if (!cardRes.ok) {
                                console.error('Failed to update card:', card.id);
                            }
                        } else {
                            // Create new card
                            console.log('Creating new card for carousel:', item.carouselId);
                            const cardRes = await fetch(`${API_URL}/carousel/${item.carouselId}/cards`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(cardData)
                            });
                            if (!cardRes.ok) {
                                const errorText = await cardRes.text();
                                console.error('Failed to create card:', cardRes.status, errorText);
                            }
                        }
                    }
                }
            }

            // Reload to get fresh data with proper IDs
            console.log('Reloading grid items...');
            await loadGridItems();
            alert('Layout saved successfully!');
        } catch (error) {
            console.error('Failed to save layout:', error);
            alert(`Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setCurrentItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const addItem = (type: GridItem["type"]) => {
        const newItem: GridItem = {
            id: `temp-${Date.now()}`,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type,
            columns: type === 'grid' ? 4 : type === 'section' ? 4 : 1,
            displayMode: type === 'list' ? 'list' : 'grid',
            showNewTag: false,
            images: [],
            htmlContent: type === 'html' ? "<div>Your HTML Content</div>" : "",
            order: currentItems.length,
            userType: activeUserType,
            isNew: true,
            carouselCards: type === 'carousel' ? [] : undefined,
            autoPlay: type === 'carousel' ? true : undefined,
            interval: type === 'carousel' ? 5000 : undefined,
            gridItems: (type === 'grid' || type === 'list' || type === 'section') ? [] : undefined,
            sectionBanners: type === 'section' ? [] : undefined,
            backgroundColor: type === 'section' ? '#1a1a2e' : undefined,
            originalCardIds: [],
        };
        setCurrentItems([...currentItems, newItem]);
        // Open editor for all types
        setEditingItem(newItem);
    };

    const removeItem = (id: string) => setCurrentItems(currentItems.filter((item) => item.id !== id));

    const updateItem = (updated: GridItem) => {
        setCurrentItems(currentItems.map(i => i.id === updated.id ? updated : i));
        setEditingItem(null);
    };

    const addCarouselCard = () => {
        if (editingItem?.type === 'carousel') {
            const newCard: CarouselCard = {
                ...emptyCard,
                id: `temp-card-${Date.now()}`,
                order: editingItem.carouselCards?.length || 0,
            };
            setEditingItem({ ...editingItem, carouselCards: [...(editingItem.carouselCards || []), newCard] });
        }
    };

    const updateCarouselCard = (index: number, card: CarouselCard) => {
        if (editingItem?.carouselCards) {
            const newCards = [...editingItem.carouselCards];
            newCards[index] = card;
            setEditingItem({ ...editingItem, carouselCards: newCards });
        }
    };

    const removeCarouselCard = (index: number) => {
        if (editingItem?.carouselCards) {
            const newCards = [...editingItem.carouselCards];
            newCards.splice(index, 1);
            setEditingItem({ ...editingItem, carouselCards: newCards });
        }
    };

    const addGridItem = () => {
        if (editingItem?.type === 'grid' || editingItem?.type === 'list') {
            const newGridItem: GridItemContent = {
                ...emptyGridItem,
                id: `temp-grid-item-${Date.now()}`,
            };
            setEditingItem({ ...editingItem, gridItems: [...(editingItem.gridItems || []), newGridItem] });
        }
    };

    const updateGridItem = (index: number, item: GridItemContent) => {
        if (editingItem?.gridItems) {
            const newItems = [...editingItem.gridItems];
            newItems[index] = item;
            setEditingItem({ ...editingItem, gridItems: newItems });
        }
    };

    const removeGridItem = (index: number) => {
        if (editingItem?.gridItems) {
            const newItems = [...editingItem.gridItems];
            newItems.splice(index, 1);
            setEditingItem({ ...editingItem, gridItems: newItems });
        }
    };

    const nextPreviewCard = (itemId: string, totalCards: number) => {
        setPreviewCardIndex(prev => ({ ...prev, [itemId]: ((prev[itemId] || 0) + 1) % totalCards }));
    };

    const prevPreviewCard = (itemId: string, totalCards: number) => {
        setPreviewCardIndex(prev => ({ ...prev, [itemId]: ((prev[itemId] || 0) - 1 + totalCards) % totalCards }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading grid layout...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 md:flex-row h-[calc(100vh-100px)]">
            {/* Configuration Panel */}
            <Card className="flex-1 overflow-hidden flex flex-col gradient-card border-0 shadow-md">
                <CardHeader className="pb-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Dashboard Grid</CardTitle>
                            <CardDescription>Configure layout separately for each user type</CardDescription>
                        </div>
                    </div>
                    
                    {/* User Type Tabs - NO ALL OPTION */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant={activeUserType === "PRE_PAID" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveUserType("PRE_PAID")}
                            className={cn("flex-1 hover-lift", activeUserType === "PRE_PAID" && "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-md")}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pre-Paid ({prePaidItems.length})
                        </Button>
                        <Button
                            variant={activeUserType === "POST_PAID" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveUserType("POST_PAID")}
                            className={cn("flex-1 hover-lift", activeUserType === "POST_PAID" && "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md")}
                        >
                            <Smartphone className="h-4 w-4 mr-2" />
                            Post-Paid ({postPaidItems.length})
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto">
                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                Add to {activeUserType === "PRE_PAID" ? "Pre-Paid" : "Post-Paid"}
                            </h3>
                            <div className="grid grid-cols-5 gap-2">
                                <Button variant="outline" size="sm" onClick={() => addItem("carousel")} className="hover:bg-primary/10 hover:border-primary/50 hover-lift">
                                    <Layers className="mr-1 h-3 w-3" /> Carousel
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addItem("grid")} className="hover:bg-primary/10 hover:border-primary/50 hover-lift">
                                    <LayoutGrid className="mr-1 h-3 w-3" /> Grid
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addItem("list")} className="hover:bg-primary/10 hover:border-primary/50 hover-lift">
                                    <List className="mr-1 h-3 w-3" /> List
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addItem("banner")} className="hover:bg-primary/10 hover:border-primary/50 hover-lift">
                                    <ImageIcon className="mr-1 h-3 w-3" /> Banner
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addItem("section")} className="hover:bg-primary/10 hover:border-primary/50 hover-lift">
                                    <Package className="mr-1 h-3 w-3" /> Section
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] border rounded-md p-3">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={(e) => setActiveId(e.active.id as string)}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={currentItems} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {currentItems.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-8">
                                                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No components for {activeUserType === "PRE_PAID" ? "Pre-Paid" : "Post-Paid"}</p>
                                                <p className="text-xs mt-1">Add one above!</p>
                                            </div>
                                        ) : (
                                            currentItems.map((item) => (
                                                <SortableItem key={item.id} item={item} onRemove={removeItem} onEdit={setEditingItem} />
                                            ))
                                        )}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId ? <div className="p-3 border rounded-lg bg-card shadow-lg opacity-80">Moving...</div> : null}
                                </DragOverlay>
                            </DndContext>
                        </ScrollArea>

                        <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift" onClick={saveLayout} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Layout</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Simulator */}
            <div className="flex-1 flex flex-col items-center gradient-card rounded-xl p-6 shadow-md border-0">
                {/* Preview Toggle */}
                <div className="mb-4 flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                    <Button
                        variant={previewUserType === "PRE_PAID" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewUserType("PRE_PAID")}
                        className={cn("hover-lift", previewUserType === "PRE_PAID" && "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-sm")}
                    >
                        <Eye className="h-3 w-3 mr-1" /> Pre-Paid
                    </Button>
                    <Button
                        variant={previewUserType === "POST_PAID" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewUserType("POST_PAID")}
                        className={cn("hover-lift", previewUserType === "POST_PAID" && "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-sm")}
                    >
                        <Eye className="h-3 w-3 mr-1" /> Post-Paid
                    </Button>
                </div>

                <div className="phone-mockup border-[8px] border-slate-900 rounded-[2.5rem] bg-background w-[300px] h-[560px] shadow-2xl overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 w-full h-7 bg-slate-900 z-10 flex justify-center">
                        <div className="w-28 h-5 bg-slate-900 rounded-b-xl"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-9 pb-4 px-3 scrollbar-hide bg-zinc-50 dark:bg-zinc-900">
                        <div className="space-y-3">
                            {previewItems.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <p className="text-sm">No content for {previewUserType === "PRE_PAID" ? "Pre-Paid" : "Post-Paid"}</p>
                                </div>
                            ) : (
                                previewItems.map(item => (
                                    <div key={item.id} className="relative">
                                        {/* Banner */}
                                        {item.type === 'banner' && (
                                            <div className="w-full aspect-[2/1] bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden shadow-sm">
                                                {item.images[0] ? <img src={getImageUrl(item.images[0])} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="text-slate-400 h-6 w-6" />}
                                                <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 rounded">{item.title}</div>
                                                {item.showNewTag && (
                                                    <Badge className="absolute top-1.5 right-1.5 text-[6px] h-4 px-1.5 bg-red-500 text-white">NEW</Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Carousel */}
                                        {item.type === 'carousel' && item.carouselCards && item.carouselCards.length > 0 && (
                                            <div className="relative">
                                                {item.showNewTag && (
                                                    <Badge className="absolute top-1.5 right-1.5 z-20 text-[6px] h-4 px-1.5 bg-red-500 text-white">NEW</Badge>
                                                )}
                                                {(() => {
                                                    const cardIndex = (previewCardIndex[item.id] || 0) % item.carouselCards!.length;
                                                    const card = item.carouselCards![cardIndex];
                                                    return (
                                                        <div className="w-full aspect-[2/1] rounded-lg flex flex-col justify-end relative overflow-hidden" style={{ backgroundColor: card.backgroundColor }}>
                                                            {card.imageUrl && <img src={getImageUrl(card.imageUrl)} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                                                            <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/60 to-transparent">
                                                                <p className="text-[9px] font-semibold" style={{ color: card.textColor }}>{card.title}</p>
                                                                <p className="text-[7px] opacity-80" style={{ color: card.textColor }}>{card.subtitle}</p>
                                                                {card.price && <p className="text-[9px] font-bold mt-0.5" style={{ color: card.textColor }}>{card.currency} {card.price}</p>}
                                                                {card.ctaText && <span className="inline-block mt-0.5 text-[7px] bg-white/20 px-1.5 py-0.5 rounded" style={{ color: card.textColor }}>{card.ctaText}</span>}
                                                            </div>
                                                            {item.carouselCards!.length > 1 && (
                                                                <>
                                                                    <button onClick={() => prevPreviewCard(item.id, item.carouselCards!.length)} className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-0.5">
                                                                        <ChevronLeft className="h-3 w-3 text-white" />
                                                                    </button>
                                                                    <button onClick={() => nextPreviewCard(item.id, item.carouselCards!.length)} className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-0.5">
                                                                        <ChevronRight className="h-3 w-3 text-white" />
                                                                    </button>
                                                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                                        {item.carouselCards!.map((_, i) => (
                                                                            <div key={i} className={cn("w-1 h-1 rounded-full", i === cardIndex ? "bg-white" : "bg-white/40")} />
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Carousel empty state */}
                                        {item.type === 'carousel' && (!item.carouselCards || item.carouselCards.length === 0) && (
                                            <div className="w-full aspect-[2/1] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <Layers className="h-5 w-5 mx-auto mb-0.5 opacity-70" />
                                                    <p className="text-[9px] opacity-80">{item.title}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grid with items - circular icon style like mobile app */}
                                        {item.type === 'grid' && (
                                            <div className="bg-white rounded-xl p-2 shadow-sm">
                                                {item.showNewTag && (
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-[8px] font-medium text-muted-foreground">{item.title}</p>
                                                        <Badge className="text-[5px] h-3 px-1 bg-red-500 text-white">NEW</Badge>
                                                    </div>
                                                )}
                                                {!item.showNewTag && <p className="text-[8px] font-medium text-muted-foreground mb-1">{item.title}</p>}
                                                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${item.columns}, minmax(0, 1fr))` }}>
                                                    {item.gridItems && item.gridItems.length > 0 ? (
                                                        item.gridItems.map((gi, i) => (
                                                            <div key={gi.id || i} className="flex flex-col items-center text-center p-1">
                                                                {/* Circular icon container */}
                                                                <div className="relative w-8 h-8 rounded-full bg-gray-100 shadow-sm flex items-center justify-center mb-1 border border-gray-200 flex-shrink-0">
                                                                    {gi.iconUrl ? (
                                                                        <img src={getImageUrl(gi.iconUrl)} className="w-5 h-5 object-contain" alt="" />
                                                                    ) : (
                                                                        <Package className="h-3 w-3 text-slate-400" />
                                                                    )}
                                                                    {/* HOT badge on item */}
                                                                    {gi.showNewTag && (
                                                                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[4px] px-0.5 rounded font-bold">HOT</span>
                                                                    )}
                                                                </div>
                                                                {/* Label below icon */}
                                                                <p className="text-[6px] font-medium text-gray-700 leading-tight w-full truncate">{gi.title || 'Item'}</p>
                                                                {gi.subtitle && <p className="text-[5px] text-gray-500 w-full truncate">{gi.subtitle}</p>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        Array.from({ length: item.columns * 2 }).map((_, i) => (
                                                            <div key={i} className="flex flex-col items-center p-1">
                                                                <div className="w-8 h-8 bg-slate-100 rounded-full mb-1 border border-gray-200"></div>
                                                                <div className="h-1 w-6 bg-slate-100 rounded"></div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* List view */}
                                        {item.type === 'list' && (
                                            <div className="bg-white rounded-xl p-3 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[9px] font-medium text-muted-foreground">{item.title}</p>
                                                    {item.showNewTag && <Badge className="text-[6px] h-3 px-1 bg-red-500 text-white">NEW</Badge>}
                                                </div>
                                                <div className="space-y-2">
                                                    {item.gridItems && item.gridItems.length > 0 ? (
                                                        item.gridItems.map((gi, i) => (
                                                            <div key={gi.id || i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                                                                    {gi.iconUrl ? (
                                                                        <img src={getImageUrl(gi.iconUrl)} className="w-5 h-5 object-contain" alt="" />
                                                                    ) : (
                                                                        <Package className="h-3 w-3 text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[8px] font-medium text-gray-700 truncate">{gi.title || 'Item'}</p>
                                                                    {gi.subtitle && <p className="text-[6px] text-gray-500 truncate">{gi.subtitle}</p>}
                                                                </div>
                                                                {gi.showNewTag && <span className="bg-red-500 text-white text-[5px] px-1 rounded font-bold">NEW</span>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        Array.from({ length: 3 }).map((_, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                                <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                                                                <div className="flex-1">
                                                                    <div className="h-2 w-16 bg-slate-100 rounded mb-1"></div>
                                                                    <div className="h-1.5 w-10 bg-slate-100 rounded"></div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Section - Grid + Swipeable Banners */}
                                        {item.type === 'section' && (
                                            <div className="-mx-3" style={{ backgroundColor: item.backgroundColor || '#1a1a2e' }}>
                                                <div className="p-3">
                                                    {/* Section Title */}
                                                    {item.title && (
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold text-white text-center w-full">{item.title}</p>
                                                            {item.showNewTag && <Badge className="text-[6px] h-3 px-1 bg-red-500 text-white absolute right-3">NEW</Badge>}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Grid Items */}
                                                    {item.gridItems && item.gridItems.length > 0 && (
                                                        <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${item.columns || 4}, minmax(0, 1fr))` }}>
                                                            {item.gridItems.map((gi, i) => (
                                                                <div key={gi.id || i} className="flex flex-col items-center text-center gap-1">
                                                                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                                                                        {gi.iconUrl ? (
                                                                            <img src={getImageUrl(gi.iconUrl)} className="w-6 h-6 object-contain" alt="" />
                                                                        ) : (
                                                                            <Package className="h-4 w-4 text-white/60" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col items-center w-full">
                                                                        <p className="text-[6px] font-medium text-white leading-tight truncate w-full">{gi.title || 'Item'}</p>
                                                                        {gi.subtitle && <p className="text-[5px] text-white/70 truncate w-full">{gi.subtitle}</p>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Swipeable Banners */}
                                                    {item.sectionBanners && item.sectionBanners.length > 0 && (
                                                        <div className="relative">
                                                            {(() => {
                                                                const bannerIndex = (previewCardIndex[`${item.id}-section`] || 0) % item.sectionBanners.length;
                                                                const banner = item.sectionBanners[bannerIndex];
                                                                return (
                                                                    <div className="w-full">
                                                                        {/* Labels above image - uniform height */}
                                                                        <div className="flex flex-col gap-0.5 mb-1 min-h-[28px]">
                                                                            <span className="text-[7px] font-bold text-yellow-400 uppercase tracking-wide h-[8px]">{banner.label || '\u00A0'}</span>
                                                                            <span className="text-[10px] font-bold text-white leading-tight h-[12px]">{banner.title || '\u00A0'}</span>
                                                                            <span className="text-[7px] text-gray-300 h-[8px]">{banner.tag || '\u00A0'}</span>
                                                                        </div>
                                                                        {/* Banner image */}
                                                                        <div className="w-full aspect-[2/1] rounded-lg overflow-hidden relative bg-black/20">
                                                                            {banner.imageUrl && <img src={getImageUrl(banner.imageUrl)} className="w-full h-full object-cover" alt="" />}
                                                                            {item.sectionBanners.length > 1 && (
                                                                                <>
                                                                                    <button onClick={() => prevPreviewCard(`${item.id}-section`, item.sectionBanners!.length)} className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-0.5">
                                                                                        <ChevronLeft className="h-3 w-3 text-white" />
                                                                                    </button>
                                                                                    <button onClick={() => nextPreviewCard(`${item.id}-section`, item.sectionBanners!.length)} className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-0.5">
                                                                                        <ChevronRight className="h-3 w-3 text-white" />
                                                                                    </button>
                                                                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                                                        {item.sectionBanners.map((_, i) => (
                                                                                            <div key={i} className={cn("w-1 h-1 rounded-full", i === bannerIndex ? "bg-white" : "bg-white/40")} />
                                                                                        ))}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-5 w-full flex justify-center items-center bg-background border-t">
                        <div className="w-20 h-1 bg-slate-300 rounded-full"></div>
                    </div>
                </div>

                <div className="mt-3 text-center">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                        GET /api/cms/dashboard?userType={previewUserType}
                    </code>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className={cn("max-h-[85vh] overflow-hidden flex flex-col", (editingItem?.type === 'carousel' || editingItem?.type === 'grid' || editingItem?.type === 'list') ? "max-w-2xl" : "max-w-md")}>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem?.type === 'carousel' ? 'Edit Carousel' : 
                             editingItem?.type === 'grid' ? 'Edit Grid' : 
                             editingItem?.type === 'list' ? 'Edit List' : 
                             editingItem?.type === 'section' ? 'Edit Section' :
                             editingItem?.type === 'banner' ? 'Edit Banner' : 'Edit Component'}
                        </DialogTitle>
                        <DialogDescription>
                            For {editingItem?.userType === "PRE_PAID" ? "Pre-Paid" : "Post-Paid"} users
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingItem && (
                        <div className="flex-1 overflow-y-auto">
                            {editingItem.type === 'carousel' ? (
                                <Tabs defaultValue="settings" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                        <TabsTrigger value="cards">Cards ({editingItem.carouselCards?.length || 0})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="settings" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Title</Label>
                                            <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Auto Play</Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Switch checked={editingItem.autoPlay ?? true} onCheckedChange={(checked) => setEditingItem({ ...editingItem, autoPlay: checked })} />
                                                <Label>Enable auto-scroll</Label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Interval</Label>
                                            <Input type="number" value={editingItem.interval || 5000} onChange={(e) => setEditingItem({ ...editingItem, interval: parseInt(e.target.value) })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">NEW Tag</Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Switch checked={editingItem.showNewTag || false} onCheckedChange={(checked) => setEditingItem({ ...editingItem, showNewTag: checked })} />
                                                <Label>Show "NEW" badge</Label>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="cards" className="mt-4">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-4">
                                                {editingItem.carouselCards?.map((card, index) => (
                                                    <CarouselCardEditor
                                                        key={card.id || index}
                                                        card={card}
                                                        index={index}
                                                        onChange={(updated) => updateCarouselCard(index, updated)}
                                                        onRemove={() => removeCarouselCard(index)}
                                                    />
                                                ))}
                                                <Button variant="outline" className="w-full" onClick={addCarouselCard}>
                                                    <Plus className="h-4 w-4 mr-2" />Add Card
                                                </Button>
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            ) : editingItem.type === 'grid' ? (
                                <Tabs defaultValue="settings" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                        <TabsTrigger value="items">Items ({editingItem.gridItems?.length || 0})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="settings" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Title</Label>
                                            <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Columns</Label>
                                            <div className="col-span-3 flex items-center gap-4">
                                                <Slider value={[editingItem.columns]} min={2} max={4} step={1} onValueChange={(val) => setEditingItem({ ...editingItem, columns: val[0] })} />
                                                <span className="font-mono w-4">{editingItem.columns}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">NEW Tag</Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Switch checked={editingItem.showNewTag || false} onCheckedChange={(checked) => setEditingItem({ ...editingItem, showNewTag: checked })} />
                                                <Label>Show "NEW" badge on section</Label>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="items" className="mt-4">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-3">
                                                {editingItem.gridItems?.map((item, index) => (
                                                    <GridItemEditor
                                                        key={item.id || index}
                                                        item={item}
                                                        index={index}
                                                        onChange={(updated) => updateGridItem(index, updated)}
                                                        onRemove={() => removeGridItem(index)}
                                                    />
                                                ))}
                                                <Button variant="outline" className="w-full" onClick={addGridItem}>
                                                    <Plus className="h-4 w-4 mr-2" />Add Grid Item
                                                </Button>
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            ) : editingItem.type === 'list' ? (
                                <Tabs defaultValue="settings" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                        <TabsTrigger value="items">Items ({editingItem.gridItems?.length || 0})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="settings" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Title</Label>
                                            <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">NEW Tag</Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Switch checked={editingItem.showNewTag || false} onCheckedChange={(checked) => setEditingItem({ ...editingItem, showNewTag: checked })} />
                                                <Label>Show "NEW" badge</Label>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="items" className="mt-4">
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-3">
                                                {editingItem.gridItems?.map((item, index) => (
                                                    <GridItemEditor
                                                        key={item.id || index}
                                                        item={item}
                                                        index={index}
                                                        onChange={(updated) => updateGridItem(index, updated)}
                                                        onRemove={() => removeGridItem(index)}
                                                    />
                                                ))}
                                                <Button variant="outline" className="w-full" onClick={addGridItem}>
                                                    <Plus className="h-4 w-4 mr-2" />Add List Item
                                                </Button>
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            ) : editingItem.type === 'banner' ? (
                                <BannerEditor 
                                    editingItem={editingItem} 
                                    setEditingItem={setEditingItem} 
                                />
                            ) : editingItem.type === 'section' ? (
                                <SectionEditor 
                                    editingItem={editingItem} 
                                    setEditingItem={setEditingItem} 
                                />
                            ) : (
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Title</Label>
                                        <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="col-span-3" />
                                    </div>  
                                </div>
                            )}
                        </div>
                    )}
                    
                    <DialogFooter className="mt-4">
                        <Button onClick={() => editingItem && updateItem(editingItem)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
