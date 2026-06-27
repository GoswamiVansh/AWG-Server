const nodemailer = require("nodemailer");

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "[EMAIL_ADDRESS]",
      pass: "ifiw lbig voby rpoi", // The spaces are automatically handled, but let's test it as is
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test" <[EMAIL_ADDRESS]>',
      to: "artwithgarima88@gmail.com", // Sending to self for testing
      subject: "Test Email Validation",
      text: "If you receive this, the app password works!",
    });
    console.log("Success! The email and password work perfectly.");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send email. The credentials might be invalid or blocked.");
    console.error(error);
  }
}

testEmail();
