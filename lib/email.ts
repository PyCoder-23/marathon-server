import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "marathonxserver@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.EMAIL_PASSWORD) {
        console.log("==========================================");
        console.log(`[MOCK EMAIL] To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body snippets: ${html.substring(0, 100)}...`);
        console.log("==========================================");
        return;
    }

    try {
        const fromAddress = process.env.EMAIL_USER || '"Marathon Server" <marathonxserver@gmail.com>';

        await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });
        console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    } catch (error) {
        console.error("[EMAIL FAILED] Failed to send email:", error);
        // We re-throw so the caller knows it failed, OR we swallow it depending on desired behavior.
        // For critical auth flows, we might want to know.
        throw error;
    }
}

export async function sendVerificationEmail(to: string, code: string) {
    const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h1>Welcome to Marathon Server!</h1>
        <p>Your training begins now. Please verify your email to access the command center.</p>
        <p>Your verification code is:</p>
        <h2 style="color: #22c55e; letter-spacing: 5px; font-size: 32px;">${code}</h2>
        <p>This code expires in 15 minutes.</p>
    </div>
    `;
    await sendEmail(to, "Verify your Email - Marathon Server", html);
}

export async function sendPasswordResetEmail(to: string, code: string) {
    const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password.</p>
        <p>Your reset code is:</p>
        <h2 style="color: #f59e0b; letter-spacing: 5px; font-size: 32px;">${code}</h2>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This code expires in 15 minutes.</p>
    </div>
    `;
    await sendEmail(to, "Reset Password - Marathon Server", html);
}
