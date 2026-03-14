import nodemailer from 'nodemailer';

// Try port 587 with STARTTLS first, fallback to port 465 with SSL
function createTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}

let transporter = createTransporter();

/**
 * Send an email with retry logic and transporter recreation on failure
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @param {number} retries - Number of retry attempts
 */
export async function sendMail(to, subject, html, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await transporter.sendMail({
                from: `"Taskora" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
            });
            console.log(`✉ Email sent to ${to}`);
            return;
        } catch (err) {
            console.error(`✉ Attempt ${attempt}/${retries} failed for ${to}:`, err.message);

            if (attempt < retries) {
                // Recreate the transporter in case the connection is stale
                transporter.close();
                transporter = createTransporter();

                const delay = attempt * 3000;
                console.log(`   Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`✉ All ${retries} attempts failed for ${to}`);
                throw err;
            }
        }
    }
}

// Verify connection on startup
transporter.verify((err) => {
    if (err) {
        console.error('✉ Email transporter verification failed:', err.message);
        console.error('   Check your EMAIL_USER and EMAIL_PASS in .env');
    } else {
        console.log('✉ Email transporter ready (SMTP 587)');
    }
});

export default transporter;
