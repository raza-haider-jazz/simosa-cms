export default function Dashboard() {
    return (
        <div>
            <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            <div className="rounded-lg border border-dashed shadow-sm h-96 items-center justify-center flex mt-4">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        You have no notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You can start selling as soon as you add a product.
                    </p>
                </div>
            </div>
        </div>
    );
}
