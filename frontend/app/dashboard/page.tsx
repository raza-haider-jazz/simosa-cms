import { Activity, Users, Package, TrendingUp } from "lucide-react";

export default function Dashboard() {
    const stats = [
        {
            title: "Total Users",
            value: "2,543",
            change: "+12.5%",
            icon: Users,
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            title: "Active Packages",
            value: "145",
            change: "+8.2%",
            icon: Package,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            title: "Total Revenue",
            value: "$54.2K",
            change: "+23.1%",
            icon: TrendingUp,
            gradient: "from-green-500 to-emerald-500",
        },
        {
            title: "System Activity",
            value: "98.5%",
            change: "+2.4%",
            icon: Activity,
            gradient: "from-orange-500 to-red-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Dashboard Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening with your CMS today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="gradient-card rounded-xl p-6 hover-lift cursor-pointer border-0 shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </p>
                                <h3 className="text-2xl font-bold tracking-tight">
                                    {stat.value}
                                </h3>
                                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {stat.change} from last month
                                </p>
                            </div>
                            <div
                                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                            >
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="gradient-card rounded-xl p-6 shadow-md border-0">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { action: "New package created", time: "2 minutes ago" },
                            { action: "User registered", time: "15 minutes ago" },
                            { action: "Content updated", time: "1 hour ago" },
                            { action: "Grid layout modified", time: "3 hours ago" },
                        ].map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                                <span className="text-sm font-medium">{activity.action}</span>
                                <span className="text-xs text-muted-foreground">
                                    {activity.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="gradient-card rounded-xl p-6 shadow-md border-0">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Active Sessions", value: "1,234", color: "from-blue-500 to-cyan-500" },
                            { label: "Pending Approvals", value: "23", color: "from-orange-500 to-red-500" },
                            { label: "Total Content Items", value: "567", color: "from-green-500 to-emerald-500" },
                        ].map((stat, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{stat.label}</span>
                                    <span className="text-sm font-bold">{stat.value}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                                        style={{ width: `${Math.random() * 40 + 60}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
