import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="font-orbitron font-bold text-lg text-white">
                        MARATHON SERVER
                    </span>
                    <p className="text-xs text-muted">
                        © {new Date().getFullYear()} Marathon Server. All rights reserved.
                    </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted">
                    <Link href="#" className="hover:text-primary transition-colors">
                        About
                    </Link>
                    <Link href="#" className="hover:text-primary transition-colors">
                        Terms
                    </Link>
                    <Link href="#" className="hover:text-primary transition-colors">
                        Privacy
                    </Link>
                    <Link href="#" className="hover:text-primary transition-colors">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    );
}
