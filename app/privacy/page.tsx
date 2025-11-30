import React from "react";

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-primary font-orbitron">Privacy Policy</h1>

            <div className="space-y-6 text-gray-300">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <p>
                    At Marathon, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Information We Collect</h2>
                <p>
                    We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, and Discord handle.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our service.</li>
                    <li>To personalize your experience and track your progress.</li>
                    <li>To communicate with you about updates and community events.</li>
                    <li>To prevent fraud and ensure fair competition.</li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Data Security</h2>
                <p>
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:marathonxserver@gmail.com" className="text-primary hover:underline">marathonxserver@gmail.com</a>.
                </p>
            </div>
        </div>
    );
}
