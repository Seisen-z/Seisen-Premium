import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_NAME 
      ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>` 
      : `"${process.env.SMTP_USER}" <${process.env.SMTP_USER}>`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 20000,
            family: 4, // Force IPv4 to avoid IPv6 timeouts on some cloud providers
        } as any);
        
        // Log configuration (safely)
        console.log(`📧 Email Service Initialized: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (Secure: ${process.env.SMTP_SECURE})`);
    } else {
        console.warn('⚠️ SMTP not configured - emails will not be sent');
        this.transporter = null;
    }
  }

  // Verify connection logic
  async verifyConnection() {
      if (!this.transporter) return false;
      try {
          await this.transporter.verify();
          console.log('✅ SMTP Connection Verified');
          return true;
      } catch (error) {
          console.error('❌ SMTP Connection Failed:', error);
          return false;
      }
  }

  async sendKeyEmail(to: string, key: string, tier: string, transactionId: string) {
    if (!this.transporter) {
        console.error('❌ Email service not configured (SMTP missing).');
        return { success: false, error: 'Email service not configured' };
    }

    // Verify connection before attempting to send (Fail fast)
    const isConnected = await this.verifyConnection();
    if (!isConnected) {
        return { success: false, error: 'SMTP Connection Failed (Port blocked?)' };
    }

    const tierNames: Record<string, string> = {
      weekly: 'Weekly (7 Days)',
      monthly: 'Monthly (30 Days)',
      lifetime: 'Lifetime (Unlimited)'
    };

    const subject = `Your Seisen Hub Premium Key - ${tierNames[tier] || tier}`;
    
    // HTML Template - Ultra Premium Dark Design
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body { margin: 0; padding: 0; background-color: #000000; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #000000; padding: 40px 0; }
        
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #09090b; 
            border-radius: 24px; 
            border: 1px solid #27272a; 
            overflow: hidden; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        /* Header with Pattern */
        .header { 
            background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
            padding: 40px 0;
            text-align: center;
            border-bottom: 1px solid #1f1f22;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -1px;
            margin-bottom: 10px;
        }
        .logo span { color: #10b981; }
        
        .status-badge {
            display: inline-block;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        /* Content Area */
        .content { padding: 40px; }
        
        .hero-text {
            color: #e4e4e7;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: center;
        }

        /* Key Box - The Main Feature */
        .key-section {
            background: radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(9, 9, 11, 0) 70%);
            padding: 20px;
            text-align: center;
            border-radius: 16px;
            margin-bottom: 40px;
            border: 1px dashed #27272a;
        }

        .key-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #71717a;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .key-box {
            background-color: #000000;
            border: 1px solid #3f3f46;
            border-radius: 12px;
            padding: 24px;
            position: relative;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05), 0 10px 25px -5px rgba(16, 185, 129, 0.15);
            transition: all 0.3s ease;
        }

        .key-text {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 20px;
            color: #10b981;
            font-weight: 700;
            word-break: break-all;
            letter-spacing: 0.5px;
            margin: 0;
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        /* Order Details Card */
        .details-card {
            background-color: #18181b;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #27272a;
        }

        .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .detail-item:first-child {
            padding-top: 0;
        }

        .detail-title {
            color: #71717a;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .detail-value {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
        }

        /* Action Button */
        .btn-container { text-align: center; }
        
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: #000000;
            font-weight: 700;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            text-align: center;
        }

        /* Footer */
        .footer {
            background-color: #050505;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #1f1f22;
        }
        
        .footer-text {
            color: #52525b;
            font-size: 12px;
            line-height: 1.5;
            margin-bottom: 15px;
        }

        .social-links { margin-top: 20px; }
        .social-links a {
            color: #71717a;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
        }
        .footer-text[style*="margin-top"] {
            margin-top: 20px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo">⚡ SEISEN<span>.HUB</span></div>
                <div class="status-badge">✅ ORDER CONFIRMED</div>
            </div>

            <!-- Content -->
            <div class="content">
                <p class="hero-text">
                    Thank you for your purchase. Your access has been secured and your premium key is ready to be redeemed.
                </p>

                <!-- Key Section -->
                <div class="key-section">
                    <div class="key-label">LICENSE KEY</div>
                    <div class="key-box">
                        <p class="key-text">${key}</p>
                    </div>
                </div>

                <!-- Details -->
                <div class="details-card">
                    <div class="detail-item">
                        <span class="detail-title">📦 Package</span>
                        <span class="detail-value">${tierNames[tier] || tier}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-title">🆔 Order ID</span>
                        <span class="detail-value" style="font-family: monospace; color: #a1a1aa;">#${transactionId.substring(0, 12)}...</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-title">📅 Date</span>
                        <span class="detail-value">${new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <!-- CTA -->
                <div class="btn-container">
                    <a href="https://discord.gg/F4sAf6z8Ph" class="btn">Join Discord Community</a>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    You received this email because you purchased a product from Seisen Hub.<br>
                    Please do not share your license key with anyone.
                </p>
                <div class="social-links">
                    <a href="https://discord.gg/F4sAf6z8Ph">Discord</a>
                    <a href="#">Terms</a>
                    <a href="#">Privacy</a>
                </div>
                <p class="footer-text" style="margin-top: 20px; opacity: 0.5;">
                    &copy; 2026 Seisen Hub. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    try {
        console.log('📧 Attempting to send via SMTP...');
        const info = await this.transporter.sendMail({
            from: this.fromEmail,
            to: to,
            subject: subject,
            html: emailHtml,
        });

        console.log('✅ Email sent via SMTP:', info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };

    } catch (error: any) {
        console.error('❌ SMTP sending failed:', error);
        return { success: false, error: error.message };
    }
  }

  async sendVerificationCode(to: string, code: string) {
    if (!this.transporter && !process.env.SMTP_HOST) {
         console.warn('⚠️ No email transport available for OTP');
         return { success: false, error: 'Email service not configured' };
    }
    
    const subject = `Your Verification Code - ${code}`;
    
    // Verify connection before attempting to send (Fail fast)
    const isConnected = await this.verifyConnection();
    if (!isConnected) {
        return { success: false, error: 'SMTP Connection Failed (Port blocked?)' };
    }
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background-color: #09090b; color: #ffffff; font-family: sans-serif; padding: 20px; text-align: center; }
        .container { max-width: 400px; margin: 0 auto; background: #18181b; padding: 40px; border-radius: 16px; border: 1px solid #27272a; }
        .logo { color: #10b981; font-weight: bold; font-size: 24px; margin-bottom: 20px; }
        .code { font-family: monospace; font-size: 32px; letter-spacing: 5px; color: #10b981; margin: 30px 0; font-weight: bold; background: #000; padding: 15px; border-radius: 8px; border: 1px dashed #10b981; }
        .text { color: #a1a1aa; margin-bottom: 20px; line-height: 1.5; }
        .footer { font-size: 12px; color: #52525b; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡ SEISEN</div>
        <p class="text">Use the code below to sign in to your Client Area.</p>
        <div class="code">${code}</div>
        <p class="text">This code will expire in 15 minutes.<br>If you didn't request this, you can ignore this email.</p>
        <div class="footer">Seisen Hub Security</div>
    </div>
</body>
</html>`;

    try {
        if (!this.transporter) {
             console.error('❌ Transporter is null');
             return { success: false, error: 'Email transporter not initialized' };
        }
        
        console.log(`📧 Sending OTP to ${to}...`);
        await this.transporter.sendMail({
            from: this.fromEmail,
            to: to,
            subject: subject,
            html: emailHtml,
        });
        console.log('✅ OTP sent successfully');
        return { success: true };
    } catch (error: any) {
        console.error('❌ Failed to send OTP:', error);
        return { success: false, error: error.message };
    }
  }
}
