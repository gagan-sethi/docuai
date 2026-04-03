const nodemailer = require("nodemailer");

async function main() {
  console.log("Creating Gmail transporter...");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ravisethi7102@gmail.com",
      pass: "oolaxttxcxblemgg",
    },
  });

  console.log("Verifying connection...");
  await transporter.verify();
  console.log("Gmail connection verified!");

  console.log("Sending test email to gagandeep.sethi@promaticsindia.com...");
  const info = await transporter.sendMail({
    from: '"DocuAI" <ravisethi7102@gmail.com>',
    to: "gagandeep.sethi@promaticsindia.com",
    subject: "DocuAI - Test Email ✅",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);border-radius:16px;padding:40px;text-align:center;color:white;margin-bottom:24px;">
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;">DocuAI</h1>
          <p style="margin:0;font-size:14px;opacity:0.8;">Email Service Test</p>
        </div>
        <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 12px;color:#1e293b;">✅ Email Delivered Successfully!</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
            This confirms that Gmail SMTP is working correctly for your DocuAI application.
            Verification and welcome emails will now be delivered.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
            <p style="margin:0;font-size:13px;color:#166534;"><strong>Transport:</strong> Gmail SMTP</p>
            <p style="margin:4px 0 0;font-size:13px;color:#166534;"><strong>Sender:</strong> ravisethi7102@gmail.com</p>
            <p style="margin:4px 0 0;font-size:13px;color:#166534;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    `,
  });

  console.log("SUCCESS! Message sent.");
  console.log("MessageId:", info.messageId);
  console.log("Response:", info.response);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  });
