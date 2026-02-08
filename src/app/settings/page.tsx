"use client";

import { useState } from "react";
import { User, Bell, LogOut, ChevronRight, Shield } from "lucide-react";

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="min-h-screen bg-[#121212] pt-20 px-4 pb-12">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-gray-400">Manage your account and preferences</p>
                </header>

                <div className="space-y-6">
                    {/* Account Section */}
                    <section className="bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center gap-3">
                            <User className="text-j-red w-5 h-5" />
                            <h2 className="text-lg font-semibold text-white">Account</h2>
                        </div>
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-j-red to-j-gold rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                J
                            </div>
                            <div>
                                <h3 className="text-white font-medium text-lg">Juneteenth User</h3>
                                <p className="text-gray-400 text-sm">user@example.com</p>
                            </div>
                            <button className="ml-auto px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                                Edit
                            </button>
                        </div>
                    </section>

                    {/* Preferences Section */}
                    <section className="bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center gap-3">
                            <Bell className="text-j-gold w-5 h-5" />
                            <h2 className="text-lg font-semibold text-white">Preferences</h2>
                        </div>

                        <div className="divide-y divide-white/5">
                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                                <div>
                                    <h3 className="text-white font-medium">Notifications</h3>
                                    <p className="text-gray-400 text-sm">Receive updates about new videos</p>
                                </div>
                                <div
                                    className={`w-12 h-6 rounded-full relative transition-colors ${notifications ? "bg-j-green" : "bg-gray-600"}`}
                                    onClick={() => setNotifications(!notifications)}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? "left-7" : "left-1"}`} />
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                                <div>
                                    <h3 className="text-white font-medium">Appearance</h3>
                                    <p className="text-gray-400 text-sm">Dark mode is enabled by default</p>
                                </div>
                                <span className="text-gray-500 text-sm flex items-center gap-2">
                                    System Default <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-j-gold" onClick={() => window.location.href = '/admin'}>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5" />
                                    <div>
                                        <h3 className="text-white font-medium">Admin Panel</h3>
                                        <p className="text-gray-400 text-sm">Manage platform content and transcoders</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <button className="w-full p-4 rounded-xl border border-red-500/20 text-red-500 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors font-medium">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>

                    <p className="text-center text-xs text-gray-600 mt-8">
                        Juneteenth Tube v1.0.2 • Build 2409
                    </p>
                </div>
            </div>
        </div>
    );
}
