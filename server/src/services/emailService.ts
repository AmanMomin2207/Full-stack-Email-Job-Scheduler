import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    console.log(`[EmailService] Attempting to send to ${to}`);
    const info = await transporter.sendMail({
        from: process.env.SMTP_USER, // sender address
        to,
        subject,
        html,
    });
    console.log(`[EmailService] Message sent: ${info.messageId}`);
    return info;
}
