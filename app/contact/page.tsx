import React from "react";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-primary font-orbitron">Contact Us</h1>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card/50 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/20 rounded-lg">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Email Us</h2>
                    </div>
                    <p className="text-gray-300 mb-6">
                        For general inquiries, support, or partnership opportunities, please send us an email.
                    </p>
                    <a
                        href="mailto:harleen.mit@gmail.com"
                        className="inline-block bg-primary hover:bg-primary/90 text-background font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        harleen.mit@gmail.com
                    </a>
                </div>

                <div className="bg-card/50 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-secondary/20 rounded-lg">
                            <MessageSquare className="w-8 h-8 text-secondary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Join Discord</h2>
                    </div>
                    <p className="text-gray-300 mb-6">
                        Connect with the community, get real-time support, and participate in events on our Discord server.
                    </p>
                    <p className="text-sm text-gray-400 italic">
                        (Link available after joining the server)
                    </p>
                </div>
            </div>
        </div>
    );
}
