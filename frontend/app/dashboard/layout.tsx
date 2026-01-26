"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    CircleUser,
    Home,
    Menu,
    Package2,
    Search,
    ShoppingCart,
    Grid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/packages", label: "Packages", icon: ShoppingCart },
    { href: "/dashboard/grid", label: "App Grid", icon: Grid },
    { href: "/dashboard/notifications", label: "Push Notifications", icon: Bell },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r gradient-sidebar md:block shadow-lg">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b border-primary/20 lg:h-[60px] bg-gradient-to-r from-primary/5 to-secondary/5">
                        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
                            <div className="bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center shadow-md px-16 py-4 gap-2">
                                <Image src="/simosa.png" alt="Simosa CMS logo" width={100} height={32} />
                                <p className="text-white text-xl">CMS</p>
                            </div>
                        </Link>
                        {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8 border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                            <Bell className="h-4 w-4 text-primary" />
                            <span className="sr-only">Toggle notifications</span>
                        </Button> */}
                    </div>
                    <div className="flex-1 mt-5">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover-lift",
                                            isActive
                                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md font-semibold hover:opacity-90"
                                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                {/* <header className="flex h-14 items-center gap-4 border-b border-primary/20 bg-white/80 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 shadow-sm">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link
                                    href="#"
                                    className="flex items-center gap-2 text-lg font-semibold"
                                >
                                    <Package2 className="h-6 w-6" />
                                    <span className="sr-only">Simosa CMS</span>
                                </Link>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                            pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                                />
                            </div>
                        </form>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover-lift">
                                <CircleUser className="h-5 w-5 text-white" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header> */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gradient-to-br from-background/50 to-transparent">
                    {children}
                </main>
            </div>
        </div>
    );
}
