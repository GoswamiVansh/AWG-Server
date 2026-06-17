import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

// ─── Shared Styles ───────────────────────────────────────────────────────

const baseStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff6f9; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(232,114,154,0.12); }
  .header { background: linear-gradient(135deg, #e8729a 0%, #c0536f 100%); padding: 32px 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; }
  .body { padding: 32px 24px; }
  .greeting { font-size: 18px; color: #2d1b2e; margin-bottom: 8px; font-weight: 700; }
  .message { color: #5a4060; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
  .order-id { background: #fff6f9; border: 1px solid rgba(232,114,154,0.2); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; }
  .order-id span { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c09aaa; display: block; }
  .order-id strong { font-size: 14px; color: #c0536f; font-family: monospace; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c09aaa; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(232,114,154,0.15); }
  .item-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f0f2; }
  .item-img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; margin-right: 12px; background: #f3e8ec; }
  .item-name { font-size: 14px; font-weight: 600; color: #2d1b2e; }
  .item-qty { font-size: 12px; color: #8a6570; }
  .item-price { font-size: 14px; font-weight: 700; color: #e8729a; text-align: right; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; margin-top: 8px; border-top: 2px solid rgba(232,114,154,0.2); }
  .total-label { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #8a6570; font-weight: 700; }
  .total-value { font-size: 20px; font-weight: 800; color: #c0536f; }
  .address-box { background: #fff6f9; border-radius: 12px; padding: 16px; margin-top: 16px; }
  .address-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c09aaa; margin: 0 0 8px; font-weight: 700; }
  .address-box p { font-size: 14px; color: #5a4060; margin: 2px 0; line-height: 1.5; }
  .status-banner { text-align: center; padding: 20px; margin: 16px 0; border-radius: 12px; }
  .status-icon { font-size: 40px; display: block; margin-bottom: 8px; }
  .status-text { font-size: 16px; font-weight: 700; }
  .footer { background: #2d1b2e; padding: 24px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0; }
  .footer a { color: #e8729a; text-decoration: none; }
  .brand-name { color: #e8729a; font-weight: 700; letter-spacing: 1px; }
`;

// ─── Build Items HTML ────────────────────────────────────────────────────

const buildItemsHtml = (items: OrderItem[]) => {
  return items
    .map(
      (item) => `
    <table cellpadding="0" cellspacing="0" style="width:100%; border-bottom: 1px solid #f5f0f2; margin-bottom: 8px;">
      <tr>
        <td style="padding: 10px 0; width: 60px; vertical-align: top;">
          <img src="${item.image}" alt="${item.name}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; background:#f3e8ec;" />
        </td>
        <td style="padding: 10px 8px; vertical-align: top;">
          <div style="font-size:14px; font-weight:600; color:#2d1b2e;">${item.name}</div>
          <div style="font-size:12px; color:#8a6570;">Qty: ${item.quantity} × ₹${item.price.toLocaleString("en-IN")}</div>
        </td>
        <td style="padding: 10px 0; text-align:right; vertical-align: top; white-space: nowrap;">
          <div style="font-size:14px; font-weight:700; color:#e8729a;">₹${(item.quantity * item.price).toLocaleString("en-IN")}</div>
        </td>
      </tr>
    </table>
  `
    )
    .join("");
};

// ─── Order Confirmed Email ───────────────────────────────────────────────

const buildOrderConfirmedEmail = (data: OrderEmailData) => {
  const subject = `✅ Order Confirmed — #${data.orderId.slice(-8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head>
<body style="background:#fff6f9; margin:0; padding:20px;">
<div class="container">
  <div class="header">
    <p style="color:rgba(255,255,255,0.85); margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase;">✦ Art With Garima ✦</p>
    <h1>Order Confirmed! 🎉</h1>
    <p>Your handcrafted order is being prepared with love</p>
  </div>
  <div class="body">
    <div class="status-banner" style="background:linear-gradient(135deg, #dcfce7, #bbf7d0); border:1px solid #86efac;">
      <span class="status-icon">✅</span>
      <span class="status-text" style="color:#15803d;">Your order has been accepted!</span>
      <p style="font-size:12px; color:#166534; margin:8px 0 0;">We're now preparing your beautiful handcrafted items</p>
    </div>

    <p class="greeting">Hi ${data.customerName}! 👋</p>
    <p class="message">
      Great news! Your order has been confirmed and our artisan is already working on your items. 
      Each piece is lovingly handcrafted, so please allow 1–2 weeks for preparation.
    </p>

    <div class="order-id">
      <span>Order ID</span>
      <strong>#${data.orderId.slice(-8).toUpperCase()}</strong>
    </div>

    <div class="section-title">📦 Order Items</div>
    ${buildItemsHtml(data.items)}

    <table cellpadding="0" cellspacing="0" style="width:100%; margin-top:12px; border-top:2px solid rgba(232,114,154,0.2); padding-top:12px;">
      <tr>
        <td style="font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#8a6570; font-weight:700;">Total</td>
        <td style="text-align:right; font-size:20px; font-weight:800; color:#c0536f;">₹${data.totalPrice.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <div class="address-box" style="margin-top:20px;">
      <h4>📍 Delivery Address</h4>
      <p style="font-weight:600; color:#2d1b2e;">${data.shippingAddress.street}</p>
      <p>${data.shippingAddress.city}, ${data.shippingAddress.state} — ${data.shippingAddress.zipCode}</p>
      <p>${data.shippingAddress.country}</p>
    </div>

    <div style="background:#fff9e6; border:1px solid #f5d86e; border-radius:12px; padding:14px; margin-top:20px; text-align:center;">
      <p style="font-size:13px; color:#7a5c00; margin:0;">
        💳 <strong>Payment:</strong> ${data.paymentMethod} — Pay ₹${data.totalPrice.toLocaleString("en-IN")} at delivery
      </p>
    </div>
  </div>
  <div class="footer">
    <p style="color:#e8729a; font-weight:600; letter-spacing:2px; margin-bottom:8px;">✦ ART WITH GARIMA ✦</p>
    <p>Thank you for supporting handmade art! 💕</p>
    <p>Questions? Reply to this email or DM us on Instagram</p>
  </div>
</div>
</body></html>`;

  return { subject, html };
};

// ─── Order Dispatched Email ──────────────────────────────────────────────

const buildOrderDispatchedEmail = (data: OrderEmailData) => {
  const subject = `🚚 Order Dispatched — #${data.orderId.slice(-8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head>
<body style="background:#fff6f9; margin:0; padding:20px;">
<div class="container">
  <div class="header">
    <p style="color:rgba(255,255,255,0.85); margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase;">✦ Art With Garima ✦</p>
    <h1>Order Shipped! 🚚</h1>
    <p>Your package is on its way to you</p>
  </div>
  <div class="body">
    <div class="status-banner" style="background:linear-gradient(135deg, #dbeafe, #bfdbfe); border:1px solid #93c5fd;">
      <span class="status-icon">🚚</span>
      <span class="status-text" style="color:#2563eb;">Your order has been dispatched!</span>
      <p style="font-size:12px; color:#1e40af; margin:8px 0 0;">It's on its way and will arrive soon</p>
    </div>

    <p class="greeting">Hi ${data.customerName}! 👋</p>
    <p class="message">
      Exciting news! Your handcrafted order has been packed with care and is now on its way to you. 
      You'll receive your package soon!
    </p>

    <div class="order-id">
      <span>Order ID</span>
      <strong>#${data.orderId.slice(-8).toUpperCase()}</strong>
    </div>

    <div class="section-title">📦 What's in your package</div>
    ${buildItemsHtml(data.items)}

    <table cellpadding="0" cellspacing="0" style="width:100%; margin-top:12px; border-top:2px solid rgba(232,114,154,0.2); padding-top:12px;">
      <tr>
        <td style="font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#8a6570; font-weight:700;">Total</td>
        <td style="text-align:right; font-size:20px; font-weight:800; color:#c0536f;">₹${data.totalPrice.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <div class="address-box" style="margin-top:20px;">
      <h4>📍 Delivering To</h4>
      <p style="font-weight:600; color:#2d1b2e;">${data.shippingAddress.street}</p>
      <p>${data.shippingAddress.city}, ${data.shippingAddress.state} — ${data.shippingAddress.zipCode}</p>
      <p>${data.shippingAddress.country}</p>
    </div>

    <div style="background:#dbeafe; border:1px solid #93c5fd; border-radius:12px; padding:14px; margin-top:20px; text-align:center;">
      <p style="font-size:13px; color:#1e40af; margin:0;">
        💡 <strong>Tip:</strong> Please keep ₹${data.totalPrice.toLocaleString("en-IN")} ready for Cash on Delivery
      </p>
    </div>
  </div>
  <div class="footer">
    <p style="color:#e8729a; font-weight:600; letter-spacing:2px; margin-bottom:8px;">✦ ART WITH GARIMA ✦</p>
    <p>Your package is on its way! 📬</p>
    <p>Questions? Reply to this email or DM us on Instagram</p>
  </div>
</div>
</body></html>`;

  return { subject, html };
};

// ─── Order Delivered Email ───────────────────────────────────────────────

const buildOrderDeliveredEmail = (data: OrderEmailData) => {
  const subject = `📦 Order Delivered — #${data.orderId.slice(-8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head>
<body style="background:#fff6f9; margin:0; padding:20px;">
<div class="container">
  <div class="header">
    <p style="color:rgba(255,255,255,0.85); margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase;">✦ Art With Garima ✦</p>
    <h1>Order Delivered! 📦</h1>
    <p>Your handcrafted items have arrived</p>
  </div>
  <div class="body">
    <div class="status-banner" style="background:linear-gradient(135deg, #dcfce7, #bbf7d0); border:1px solid #86efac;">
      <span class="status-icon">🎉</span>
      <span class="status-text" style="color:#15803d;">Successfully Delivered!</span>
      <p style="font-size:12px; color:#166534; margin:8px 0 0;">We hope you love your handcrafted treasures</p>
    </div>

    <p class="greeting">Hi ${data.customerName}! 👋</p>
    <p class="message">
      Your order has been delivered! We hope you absolutely love your handcrafted items. 
      Each piece was made with love and care just for you. ❤️
    </p>

    <div class="order-id">
      <span>Order ID</span>
      <strong>#${data.orderId.slice(-8).toUpperCase()}</strong>
    </div>

    <div class="section-title">📦 Delivered Items</div>
    ${buildItemsHtml(data.items)}

    <table cellpadding="0" cellspacing="0" style="width:100%; margin-top:12px; border-top:2px solid rgba(232,114,154,0.2); padding-top:12px;">
      <tr>
        <td style="font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#8a6570; font-weight:700;">Total Paid</td>
        <td style="text-align:right; font-size:20px; font-weight:800; color:#c0536f;">₹${data.totalPrice.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <div style="background:linear-gradient(135deg, #fce4ec, #fce7f3); border:1px solid rgba(232,114,154,0.3); border-radius:12px; padding:20px; margin-top:24px; text-align:center;">
      <p style="font-size:16px; margin:0 0 8px; color:#2d1b2e; font-weight:700;">Loved your order? 💕</p>
      <p style="font-size:13px; color:#8a6570; margin:0;">
        Share a photo of your items on Instagram and tag us!<br/>
        Your support means the world to us 🌸
      </p>
    </div>
  </div>
  <div class="footer">
    <p style="color:#e8729a; font-weight:600; letter-spacing:2px; margin-bottom:8px;">✦ ART WITH GARIMA ✦</p>
    <p>Thank you for choosing handmade art! 💕</p>
    <p>Questions? Reply to this email or DM us on Instagram</p>
  </div>
</div>
</body></html>`;

  return { subject, html };
};

// ─── Send Email Function ─────────────────────────────────────────────────

export const sendOrderStatusEmail = async (
  status: string,
  data: OrderEmailData
): Promise<boolean> => {
  // Skip if email credentials are not configured
  if (!resend) {
    console.log("⚠️  Resend not configured. Skipping email notification.");
    return false;
  }

  if (!data.customerEmail) {
    console.log("⚠️  No customer email found. Skipping email notification.");
    return false;
  }

  let emailContent: { subject: string; html: string } | null = null;

  switch (status) {
    case "accepted":
      emailContent = buildOrderConfirmedEmail(data);
      break;
    case "dispatched":
      emailContent = buildOrderDispatchedEmail(data);
      break;
    case "delivered":
      emailContent = buildOrderDeliveredEmail(data);
      break;
    default:
      // No email for pending or rejected status
      return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Art With Garima <hello@artwithgarima.in>',
      to: data.customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }

    console.log(`✅ Email sent to ${data.customerEmail} for status: ${status}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};

export const sendCustomRequestEmail = async (data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  whatsappNumber: string;
  quantity: number;
  material: string;
  thoughts: string;
  referencePhotoUrl?: string;
}) => {
  if (!resend) {
    console.log("⚠️ Resend not configured. Skipping email notification.");
    return false;
  }

  const subject = `✨ New Custom Order Request from ${data.customerName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${baseStyles}
      </style>
    </head>
    <body style="background:#fff6f9; margin:0; padding:20px;">
      <div class="container">
        <div class="header">
          <p style="color:rgba(255,255,255,0.85); margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase;">✦ Art With Garima ✦</p>
          <h1>New Custom Request! 🎨</h1>
          <p>A customer has shared their custom order thoughts</p>
        </div>
        <div class="body">
          <p class="greeting">Customer Details:</p>
          <ul style="list-style:none; padding:0; margin:0 0 20px; font-size:14px; color:#2d1b2e; line-height: 1.6;">
            <li><strong>Name:</strong> ${data.customerName}</li>
            <li><strong>Email:</strong> ${data.customerEmail}</li>
            <li><strong>Phone:</strong> ${data.customerPhone || '—'}</li>
            <li><strong>WhatsApp:</strong> ${data.whatsappNumber}</li>
          </ul>

          <div class="section-title">📝 Request Details</div>
          <div style="background:#fff6f9; border:1px solid rgba(232,114,154,0.2); border-radius:12px; padding:16px; margin-bottom:20px; font-size:14px; color:#5a4060;">
            <p style="margin: 0 0 10px;"><strong>Quantity:</strong> ${data.quantity}</p>
            <p style="margin: 0 0 10px;"><strong>Material:</strong> ${data.material}</p>
            <p style="margin: 0 0 10px;"><strong>Thoughts/Description:</strong></p>
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.thoughts}</p>
          </div>

          ${data.referencePhotoUrl ? `
            <div class="section-title">🖼️ Reference Photo</div>
            <div style="text-align:center; margin-bottom:20px;">
              <img src="${data.referencePhotoUrl}" alt="Reference Photo" style="max-width:100%; max-height:400px; border-radius:12px; border:1px solid #f3e8ec; object-fit:contain;" />
              <p style="font-size:12px; color:#8a6570; margin-top:8px;">
                <a href="${data.referencePhotoUrl}" target="_blank" style="color:#e8729a; text-decoration:none; font-weight:bold;">View Full Image</a>
              </p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p style="color:#e8729a; font-weight:600; letter-spacing:2px; margin-bottom:8px;">✦ ART WITH GARIMA ✦</p>
          <p>This is an automated request notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'artwithgarima88@gmail.com'; // Fallback to provided email
    const { error } = await resend.emails.send({
      from: 'Art With Garima <hello@artwithgarima.in>',
      to: adminEmail, // send to admin
      subject,
      html,
    });

    if (error) {
      console.error("❌ Failed to send custom request notification email:", error);
      return false;
    }

    console.log(`✅ Custom request notification email sent to admin`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send custom request notification email:", error);
    return false;
  }
};
