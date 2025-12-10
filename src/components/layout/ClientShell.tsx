"use client";

import { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { VideoProvider } from "@/context/VideoContext";

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <VideoProvider>
            <div className="min-h-screen bg-transparent text-foreground">
                <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <Sidebar isOpen={isSidebarOpen} />

                <main
                    className={cn(
                        "pt-16 transition-all duration-300 min-h-screen",
                        isSidebarOpen ? "sm:pl-64" : "sm:pl-[72px]"
                    )}
                >
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </VideoProvider>
    );
}
