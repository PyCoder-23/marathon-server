import React from "react";

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-primary font-orbitron">Terms of Service</h1>

            <div className="space-y-6 text-gray-300">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <p>
                    Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Marathon website and service operated by us.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">1. Acceptance of Terms</h2>
                <p>
                    By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">2. Accounts</h2>
                <p>
                    When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">3. Code of Conduct</h2>
                <p>
                    You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the Service. Harassment, cheating, or any form of disruptive behavior will not be tolerated.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">4. Termination</h2>
                <p>
                    We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">5. Changes</h2>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Contact Us</h2>
                <p>
                    If you have any questions about these Terms, please contact us at <a href="mailto:harleen.mit@gmail.com" className="text-primary hover:underline">harleen.mit@gmail.com</a>.
                </p>
            </div>
        </div>
    );
}
