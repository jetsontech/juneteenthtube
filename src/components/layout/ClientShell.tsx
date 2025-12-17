"use client";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { VideoProvider } from "@/context/VideoContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function ShellContent({ children }: { children: React.ReactNode }) {
    const { isOpen, toggle } = useSidebar();

    return (
        <div className="min-h-screen bg-transparent text-foreground">
            <Navbar onMenuClick={toggle} />
            <Sidebar isOpen={isOpen} />

            <main
                className={cn(
                    "pt-16 transition-all duration-300 min-h-screen",
                    isOpen ? "sm:pl-64" : "sm:pl-[72px]"
                )}
            >
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <VideoProvider>
                <ShellContent>{children}</ShellContent>
            </VideoProvider>
        </SidebarProvider>
    );
}
