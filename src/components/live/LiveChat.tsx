"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
    Send,
    X,
    Share2,
    MessageCircle,
    Users
} from "lucide-react";

interface Message {
    id: string;
    created_at: string;
    user_name: string;
    content: string;
    user_id: string;
}

interface LiveChatProps {
    channelId: string;
    channelName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function LiveChat({ channelId, channelName, isOpen, onClose }: LiveChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, any> } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // ── Get User ─────────────────────────────────────────────
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    // ── Fetch & Subscribe ────────────────────────────────────
    useEffect(() => {
        if (!channelId || !isOpen) return;

        // Initial fetch
        const fetchMessages = async () => {
            const { data } = await supabase
                .from("live_messages")
                .select("*")
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .limit(50);

            if (data) setMessages(data);
        };
        fetchMessages();

        // Subscription
        const channel = supabase
            .channel(`live_chat:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "live_messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, isOpen]);

    // ── Auto Scroll ──────────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // ── Send Message ─────────────────────────────────────────
    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || !channelId) return;

        const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous";

        const { error } = await supabase.from("live_messages").insert([
            {
                channel_id: channelId,
                user_id: user.id,
                user_name: userName,
                content: newMessage.trim(),
            },
        ]);

        if (error) {
            console.error("Failed to send message:", error);
        } else {
            setNewMessage("");
        }
    };

    // ── Native Mobile Share ──────────────────────────────────
    const handleSmsInvite = async () => {
        const shareData = {
            title: `Watch ${channelName} with me!`,
            text: `I'm watching ${channelName} on JuneteenthTube. Join the conversation!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for desktop: SMS deep link
                const smsUrl = `sms:?&body=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
                window.location.href = smsUrl;
            }
        } catch (err) {
            console.warn("Share failed:", err);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            {/* Chat Drawer */}
            <div className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-[400px] z-[100] transition-all duration-500 transform ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                <div className="flex-1 flex flex-col bg-zinc-900/80 backdrop-blur-2xl border-l border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.5)]">

                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center border border-red-500/20">
                                <MessageCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-tight text-shadow-sm">Live Chat</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">{channelName}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <X className="w-5 h-5 text-white/40 group-hover:text-white" />
                        </button>
                    </div>

                    {/* Social/Sharing Actions */}
                    <div className="p-3 bg-white/5 flex gap-2">
                        <button
                            onClick={handleSmsInvite}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 text-white py-2 rounded-xl text-xs font-bold transition-all border border-red-500/30 active:scale-95"
                            title="Invite friends & family"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Invite Family</span>
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-white/5 active:scale-95"
                            title="View room members"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Room (3)</span>
                        </button>
                    </div>

                    {/* Messages List */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
                                <MessageCircle className="w-12 h-12 mb-4 stroke-1" />
                                <p className="text-xs font-bold uppercase tracking-widest">Start the conversation</p>
                                <p className="text-[10px] mt-2">Messages are encrypted and private to this room.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? "items-end" : "items-start"}`}>
                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-white/30">{msg.user_name}</span>
                                        <span className="text-[9px] text-white/10">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.user_id === user?.id
                                        ? "bg-red-600 text-white rounded-tr-none shadow-lg shadow-red-600/10"
                                        : "bg-white/5 text-white/90 border border-white/10 rounded-tl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-900/40 border-t border-white/10 pb-8 md:pb-4">
                        {!user ? (
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Log in to chat</p>
                            </div>
                        ) : (
                            <form
                                onSubmit={sendMessage}
                                className="relative flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Message family & friends..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-red-500/50 focus:bg-white/10 transition-all pr-12"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className={`absolute right-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newMessage.trim() ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-white/5 text-white/20"
                                        }`}
                                    title="Send message"
                                >
                                    <Send className="w-4 h-4 mr-0.5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
