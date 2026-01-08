"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash } from "lucide-react";

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

type Package = {
    id: string;
    name: string;
    price: number;
    currency: string;
    imageUrl?: string;
    isActive: boolean;
    category?: { name: string };
};

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPackage, setNewPackage] = useState({
        name: "",
        price: "",
        categoryId: "", // In a real app, this would be a select from fetched categories
        imageUrl: "",
    });

    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

    const fetchPackages = async () => {
        try {
            const res = await fetch("http://localhost:4000/packages");
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
            const res = await fetch("http://localhost:4000/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                // Set default if exists
                if (data.length > 0) {
                    setNewPackage(prev => ({ ...prev, categoryId: data[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    useEffect(() => {
        fetchPackages();
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        try {
            const res = await fetch("http://localhost:4000/packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPackage,
                    price: parseFloat(newPackage.price) || 0,
                    // Mock category ID for now if empty, or handle in backend
                    categoryId: newPackage.categoryId || "default-category-id"
                }),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                fetchPackages();
                setNewPackage({ name: "", price: "", categoryId: "", imageUrl: "" });
            }
        } catch (error) {
            console.error("Failed to create package", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`http://localhost:4000/packages/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchPackages();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Packages</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Package
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Package</DialogTitle>
                            <DialogDescription>
                                Create a new package for the application.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newPackage.name}
                                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">
                                    Price
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={newPackage.price}
                                    onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            {/* Simplified Category ID input for now */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">
                                    Category
                                </Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                    value={newPackage.categoryId}
                                    onChange={(e) => setNewPackage({ ...newPackage, categoryId: e.target.value })}
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="image" className="text-right">
                                    Image URL
                                </Label>
                                <Input
                                    id="image"
                                    value={newPackage.imageUrl}
                                    onChange={(e) => setNewPackage({ ...newPackage, imageUrl: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Save changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Packages</CardTitle>
                    <CardDescription>
                        Manage your packages, prices, and visibility.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    Image
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Category
                                </TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                                </TableRow>
                            ) : packages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No packages found</TableCell>
                                </TableRow>
                            ) : (
                                packages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            {pkg.imageUrl && <img
                                                alt="Product image"
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={pkg.imageUrl}
                                                width="64"
                                            />}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {pkg.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={pkg.isActive ? "default" : "secondary"}>
                                                {pkg.isActive ? "Active" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            ${pkg.price}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {pkg.category?.name || "Uncategorized"}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(pkg.id)} className="text-destructive">Delete</DropdownMenuItem>
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
        </div>
    );
}
