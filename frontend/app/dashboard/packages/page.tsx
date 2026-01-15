"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash, Upload, Image as ImageIcon, Eye, EyeOff, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Package = {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    imageUrl?: string;
    isActive: boolean;
    category?: { id: string; name: string };
    categoryId: string;
    tags: string[];
};

type Category = {
    id: string;
    name: string;
};

const emptyPackage = {
    name: "",
    description: "",
    price: "",
    currency: "PKR",
    period: "MONTHLY" as const,
    categoryId: "",
    imageUrl: "",
    tags: [] as string[],
    isActive: true,
};

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [formData, setFormData] = useState(emptyPackage);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterPeriod, setFilterPeriod] = useState<string>("all");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchPackages = async () => {
        try {
            const res = await fetch(`${API_URL}/packages`);
            if (res.ok) {
                const data = await res.json();
                setPackages(data);
            }
        } catch (error) {
            console.error("Failed to fetch packages", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                // If no categories, seed them
                if (data.length === 0) {
                    await fetch(`${API_URL}/categories/seed`, { method: 'POST' });
                    const resAfterSeed = await fetch(`${API_URL}/categories`);
                    if (resAfterSeed.ok) {
                        const seededData = await resAfterSeed.json();
                        setCategories(seededData);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    useEffect(() => {
        fetchPackages();
        fetchCategories();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            // Convert to base64 for preview and upload
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                
                // Upload to backend
                const res = await fetch(`${API_URL}/upload/base64`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataUrl: base64 }),
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({ ...prev, imageUrl: data.url }));
                } else {
                    // Fallback to base64 if upload fails
                    setFormData(prev => ({ ...prev, imageUrl: base64 }));
                }
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Failed to upload image", error);
            setUploadingImage(false);
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
            };

            const res = await fetch(`${API_URL}/packages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                setIsDialogOpen(false);
                fetchPackages();
                resetForm();
            }
        } catch (error) {
            console.error("Failed to create package", error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingPackage) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
            };

            const res = await fetch(`${API_URL}/packages/${editingPackage.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                setIsDialogOpen(false);
                fetchPackages();
                resetForm();
            }
        } catch (error) {
            console.error("Failed to update package", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;
        try {
            const res = await fetch(`${API_URL}/packages/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchPackages();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleToggleActive = async (pkg: Package) => {
        try {
            const res = await fetch(`${API_URL}/packages/${pkg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !pkg.isActive }),
            });
            if (res.ok) {
                fetchPackages();
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const openEditDialog = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            description: pkg.description || "",
            price: pkg.price?.toString() || "",
            currency: pkg.currency || "PKR",
            period: pkg.period || "MONTHLY",
            categoryId: pkg.categoryId || "",
            imageUrl: pkg.imageUrl || "",
            tags: pkg.tags || [],
            isActive: pkg.isActive,
        });
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setEditingPackage(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            ...emptyPackage,
            categoryId: categories[0]?.id || "",
        });
        setEditingPackage(null);
    };

    const getImageUrl = (url: string | undefined) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${API_URL}${url}`;
    };

    const getPeriodBadgeColor = (period: string) => {
        switch (period) {
            case 'DAILY': return 'bg-orange-500';
            case 'WEEKLY': return 'bg-blue-500';
            case 'MONTHLY': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'Data': return 'bg-cyan-500';
            case 'Hybrid': return 'bg-green-500';
            case 'Calls': return 'bg-pink-500';
            case 'SMS': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    // Filter packages
    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || pkg.category?.id === filterCategory;
        const matchesPeriod = filterPeriod === "all" || pkg.period === filterPeriod;
        return matchesSearch && matchesCategory && matchesPeriod;
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Packages</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your packages, prices, and visibility.</p>
                </div>
                <Button 
                    onClick={openCreateDialog}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Package
                </Button>
            </div>

            {/* Filters */}
            <Card className="gradient-card border-0 shadow-md">
                <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search packages..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Periods</SelectItem>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Packages Table */}
            <Card className="gradient-card border-0 shadow-md">
                <CardHeader className="border-b border-primary/10">
                    <CardTitle className="text-xl font-bold">All Packages</CardTitle>
                    <CardDescription>
                        {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPackages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No packages found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPackages.map((pkg) => (
                                    <TableRow key={pkg.id} className={!pkg.isActive ? "opacity-50" : ""}>
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                                                {pkg.imageUrl ? (
                                                    <img
                                                        src={getImageUrl(pkg.imageUrl) || ''}
                                                        alt={pkg.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{pkg.name}</p>
                                                {pkg.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {pkg.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getCategoryBadgeColor(pkg.category?.name || '')} text-white border-0`}>
                                                {pkg.category?.name || "Uncategorized"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getPeriodBadgeColor(pkg.period)} text-white border-0`}>
                                                {pkg.period}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {pkg.currency} {pkg.price}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(pkg)}
                                                className={pkg.isActive ? "text-green-600" : "text-muted-foreground"}
                                            >
                                                {pkg.isActive ? (
                                                    <><Eye className="h-4 w-4 mr-1" /> Active</>
                                                ) : (
                                                    <><EyeOff className="h-4 w-4 mr-1" /> Hidden</>
                                                )}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(pkg)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(pkg.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] gradient-card border-0">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
                        <DialogDescription>
                            {editingPackage ? 'Update the package details below.' : 'Fill in the details to create a new package.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Package Image</Label>
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : formData.imageUrl ? (
                                        <img 
                                            src={getImageUrl(formData.imageUrl) || formData.imageUrl} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Upload</span>
                                        </div>
                                    )}
                                </div>
                                {formData.imageUrl && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Package name"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Package description"
                                rows={2}
                            />
                        </div>

                        {/* Price and Currency */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select 
                                    value={formData.currency} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PKR">PKR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Category and Period */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select 
                                    value={formData.categoryId} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Period *</Label>
                                <Select 
                                    value={formData.period} 
                                    onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY") => setFormData(prev => ({ ...prev, period: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Visibility</Label>
                                <p className="text-xs text-muted-foreground">Show this package to users</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={editingPackage ? handleUpdate : handleCreate}
                            disabled={saving || !formData.name || !formData.categoryId}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                        >
                            {saving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                editingPackage ? 'Update Package' : 'Create Package'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
