import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === "true";

const canSend =
  Boolean(smtpHost && smtpPort && smtpUser && smtpPass) && Number.isFinite(smtpPort);

const transporter = canSend
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : undefined;

type Template =
  | { type: "depositApproved"; email: string; amount: number }
  | { type: "withdrawalProcessed"; email: string; amount: number; txid: string }
  | { type: "packagePurchased"; email: string; packageName: string; amount: number };

const buildMessage = (payload: Template) => {
  switch (payload.type) {
    case "depositApproved":
      return {
        subject: "Deposit Approved",
        text: `Your deposit of ${payload.amount} LTC has been approved and added to your balance.`,
      };
    case "withdrawalProcessed":
      return {
        subject: "Withdrawal Completed",
        text: `Your withdrawal of ${payload.amount} LTC has been processed. Transaction ID: ${payload.txid}`,
      };
    case "packagePurchased":
      return {
        subject: "Package Purchase Confirmed",
        text: `You have successfully purchased the ${payload.packageName} package for ${payload.amount} LTC.`,
      };
    default:
      return { subject: "Notification", text: "You have a new notification." };
  }
};

export const sendEmail = async (payload: Template) => {
  const message = buildMessage(payload);
  if (!transporter) {
    console.info("[EMAIL]", payload.type, payload);
    return;
  }

  await transporter.sendMail({
    from: smtpUser,
    to: payload.email,
    subject: message.subject,
    text: message.text,
  });
};
