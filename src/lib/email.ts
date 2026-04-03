/**
 * Email service - Gmail SMTP with beautiful HTML templates.
 *
 * Uses Gmail App Password (GMAIL_APP_PASSWORD + GMAIL_USER)
 * as the primary transport. Falls back to Ethereal for dev
 * testing if Gmail credentials are not set.
 */

import nodemailer from "nodemailer";

// --- Transporter ---

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // Gmail App Password (preferred)
  if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log("[email] Using Gmail SMTP:", process.env.GMAIL_USER);
    return transporter;
  }

  // Generic SMTP env vars
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("[email] Using SMTP transport:", process.env.SMTP_HOST);
    return transporter;
  }

  // Fallback: Ethereal (captured, not delivered)
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("[email] Using Ethereal (emails wont be delivered):", testAccount.user);
  return transporter;
}

const FROM_NAME = "DocuAI";
const FROM_EMAIL = process.env.GMAIL_USER || process.env.SMTP_FROM || "noreply@docuai.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// --- Colour Palette ---
const C = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  secondary: "#06b6d4",
  success: "#10b981",
  successDark: "#059669",
  amber: "#f59e0b",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate600: "#475569",
  slate400: "#94a3b8",
  slate100: "#f1f5f9",
  surface: "#f8fafc",
  white: "#ffffff",
};

// --- Base Template ---

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocuAI</title>
</head>
<body style="margin:0;padding:0;background-color:${C.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.surface};">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,${C.primary},${C.secondary});border-radius:14px;padding:12px 18px;">
                    <span style="font-size:22px;font-weight:800;color:${C.white};letter-spacing:-0.5px;">Docu</span><span style="font-size:22px;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:-0.5px;">AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.white};border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
                ${content}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:${C.slate400};">&copy; ${new Date().getFullYear()} DocuAI &middot; AI-Powered Document Processing</p>
              <p style="margin:0;font-size:11px;color:${C.slate400};">You received this because you signed up at <a href="${APP_URL}" style="color:${C.primary};text-decoration:none;">DocuAI</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- Helper: Feature Row ---
function featureRow(emoji: string, title: string, desc: string): string {
  return `
  <tr>
    <td style="padding:14px 18px;background-color:${C.surface};border-radius:12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="width:44px;vertical-align:top;font-size:22px;padding-top:1px;">${emoji}</td>
          <td>
            <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:${C.slate800};">${title}</p>
            <p style="margin:0;font-size:12px;color:${C.slate600};line-height:1.5;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>`;
}

// --- Helper: CTA Button ---
function ctaButton(text: string, url: string, gradient = `${C.primary}, ${C.primaryDark}`): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <a href="${url}" style="display:inline-block;padding:15px 44px;background:linear-gradient(135deg,${gradient});color:${C.white};font-size:14px;font-weight:700;text-decoration:none;border-radius:14px;box-shadow:0 4px 16px rgba(99,102,241,0.35);letter-spacing:0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// --- Helper: Plan Info Card ---
function planInfoCard(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:16px;border:2px solid #e2e8f0;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,${C.slate900},${C.primaryDark});padding:18px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">YOUR PLAN</p>
                    <p style="margin:0;font-size:20px;font-weight:800;color:${C.white};">Free Plan</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.15);border-radius:20px;font-size:11px;font-weight:700;color:${C.white};border:1px solid rgba(255,255,255,0.2);">Active</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${C.slate400};text-transform:uppercase;letter-spacing:0.5px;">Documents/Month</p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:${C.slate800};">5</p>
                  </td>
                  <td style="width:50%;padding-left:12px;border-left:1px solid ${C.slate100};">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${C.slate400};text-transform:uppercase;letter-spacing:0.5px;">Includes</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:${C.slate800};line-height:1.6;">OCR &middot; AI Extraction &middot; Excel Export</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border-radius:12px;padding:4px 0;">
                <tr><td style="padding:7px 16px;"><span style="display:inline-block;width:18px;height:18px;background:${C.success};color:white;border-radius:50%;text-align:center;line-height:18px;font-size:11px;font-weight:700;margin-right:10px;">&#10003;</span><span style="font-size:13px;color:${C.slate600};">AI-powered OCR extraction</span></td></tr>
                <tr><td style="padding:7px 16px;"><span style="display:inline-block;width:18px;height:18px;background:${C.success};color:white;border-radius:50%;text-align:center;line-height:18px;font-size:11px;font-weight:700;margin-right:10px;">&#10003;</span><span style="font-size:13px;color:${C.slate600};">PDF, JPG, PNG support</span></td></tr>
                <tr><td style="padding:7px 16px;"><span style="display:inline-block;width:18px;height:18px;background:${C.success};color:white;border-radius:50%;text-align:center;line-height:18px;font-size:11px;font-weight:700;margin-right:10px;">&#10003;</span><span style="font-size:13px;color:${C.slate600};">Export to Excel</span></td></tr>
                <tr><td style="padding:7px 16px;"><span style="display:inline-block;width:18px;height:18px;background:${C.success};color:white;border-radius:50%;text-align:center;line-height:18px;font-size:11px;font-weight:700;margin-right:10px;">&#10003;</span><span style="font-size:13px;color:${C.slate600};">5 documents every month</span></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}


// ===================================================================
//  EMAIL: Verification
// ===================================================================

export async function sendVerificationEmail(
  email: string,
  fullName: string,
  verificationToken: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verificationToken}`;
  const firstName = fullName.split(" ")[0];

  const content = `
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,${C.primary},${C.primaryDark});padding:44px 40px 36px;text-align:center;">
        <div style="width:72px;height:72px;margin:0 auto 18px;background:rgba(255,255,255,0.15);border-radius:50%;line-height:72px;font-size:32px;border:2px solid rgba(255,255,255,0.2);">&#9993;</div>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:${C.white};letter-spacing:-0.5px;">Verify Your Email</h1>
        <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.75);">One quick step to activate your account</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 40px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${C.slate800};">Hi ${firstName}!</p>
        <p style="margin:0 0 24px;font-size:14px;color:${C.slate600};line-height:1.75;">
          Thanks for signing up for <strong style="color:${C.slate800};">DocuAI</strong> &mdash; the smartest way to extract data from your documents.
          Please verify your email address to activate your account. This link expires in <strong>24 hours</strong>.
        </p>
        ${ctaButton("Verify Email Address &rarr;", verifyUrl)}
        <!-- Link fallback -->
        <div style="background:${C.surface};border-radius:12px;padding:16px 18px;margin-bottom:24px;border:1px solid ${C.slate100};">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.slate400};text-transform:uppercase;letter-spacing:0.8px;">Or copy &amp; paste this link</p>
          <p style="margin:0;font-size:12px;color:${C.primary};word-break:break-all;line-height:1.6;">${verifyUrl}</p>
        </div>
        <!-- Plan info -->
        ${planInfoCard()}
        <!-- Security note -->
        <div style="text-align:center;padding-top:8px;">
          <p style="margin:0;font-size:12px;color:${C.slate400};line-height:1.6;">&#128274; Didn&rsquo;t sign up for DocuAI? You can safely ignore this email.</p>
        </div>
      </td>
    </tr>`;

  const html = baseTemplate(content);

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Verify your DocuAI email address",
    html,
  });

  console.log("[email] Verification email sent to", email);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("[email] Preview:", previewUrl);
  }
}


// ===================================================================
//  EMAIL: Welcome (after verification)
// ===================================================================

export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<void> {
  const firstName = fullName.split(" ")[0];
  const dashboardUrl = `${APP_URL}/dashboard`;
  const uploadUrl = `${APP_URL}/dashboard/upload`;

  const content = `
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,${C.success},${C.successDark});padding:44px 40px 36px;text-align:center;">
        <div style="width:72px;height:72px;margin:0 auto 18px;background:rgba(255,255,255,0.15);border-radius:50%;line-height:72px;font-size:32px;border:2px solid rgba(255,255,255,0.2);">&#127881;</div>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:${C.white};letter-spacing:-0.5px;">Welcome to DocuAI!</h1>
        <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Your email is verified &mdash; you&rsquo;re all set!</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 16px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${C.slate800};">Hey ${firstName}!</p>
        <p style="margin:0 0 28px;font-size:14px;color:${C.slate600};line-height:1.75;">Your account is live and ready to go. Here&rsquo;s what you can do with DocuAI:</p>
        <!-- Features -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          ${featureRow("&#128196;", "Upload Documents", "Upload PDFs, images, or scanned documents in seconds")}
          ${featureRow("&#129302;", "AI-Powered Extraction", "Our AI reads and extracts structured data automatically")}
          ${featureRow("&#128202;", "Export to Excel", "Download your extracted data as clean spreadsheets")}
          ${featureRow("&#9889;", "Instant Processing", "Get results in seconds, not hours of manual data entry")}
        </table>
      </td>
    </tr>
    <!-- Plan Card -->
    <tr>
      <td style="padding:0 40px 16px;">
        ${planInfoCard()}
      </td>
    </tr>
    <!-- Getting Started -->
    <tr>
      <td style="padding:0 40px 36px;">
        <div style="background:linear-gradient(135deg,${C.surface},#eef2ff);border-radius:16px;padding:24px;border:1px solid #e0e7ff;text-align:center;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${C.slate800};">&#128640; Ready to get started?</p>
          <p style="margin:0 0 20px;font-size:13px;color:${C.slate600};">Upload your first document and see AI extraction in action.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${uploadUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,${C.primary},${C.primaryDark});color:${C.white};font-size:13px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,0.3);">Upload Document</a>
              </td>
              <td style="padding-left:8px;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:${C.white};color:${C.primary};font-size:13px;font-weight:700;text-decoration:none;border-radius:12px;border:2px solid #e0e7ff;">View Dashboard</a>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Help -->
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <p style="margin:0;font-size:13px;color:${C.slate400};line-height:1.6;">Questions? Just reply to this email &mdash; we&rsquo;re happy to help!</p>
      </td>
    </tr>`;

  const html = baseTemplate(content);

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to DocuAI, ${firstName}! Your Free Plan is Active`,
    html,
  });

  console.log("[email] Welcome email sent to", email);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("[email] Preview:", previewUrl);
  }
}
