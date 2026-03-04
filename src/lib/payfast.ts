import crypto from "crypto";

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";

interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first?: string;
  email_address?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
}

export function getPayFastUrl(): string {
  return process.env.PAYFAST_SANDBOX === "true"
    ? PAYFAST_SANDBOX_URL
    : PAYFAST_LIVE_URL;
}

export function buildPayFastPayload(params: {
  orderId: string;
  amountCents: number;
  itemName: string;
  email?: string;
  firstName?: string;
}): PayFastPaymentData {
  return {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: process.env.PAYFAST_RETURN_URL!,
    cancel_url: process.env.PAYFAST_CANCEL_URL!,
    notify_url: process.env.PAYFAST_ITN_URL!,
    m_payment_id: params.orderId,
    amount: (params.amountCents / 100).toFixed(2),
    item_name: params.itemName,
    email_address: params.email,
    name_first: params.firstName,
  };
}

export function generatePayFastSignature(
  data: Record<string, string | undefined>,
  passphrase?: string
): string {
  const params = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([k, v]) =>
        `${k}=${encodeURIComponent(String(v)).replace(/%20/g, "+")}`
    )
    .join("&");

  const stringToSign = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}` : params;
  return crypto.createHash("md5").update(stringToSign).digest("hex");
}

export function verifyPayFastSignature(
  body: Record<string, string>,
  passphrase?: string
): boolean {
  const receivedSignature = body.signature;
  const data = { ...body };
  delete data.signature;

  const computed = generatePayFastSignature(data, passphrase);
  return computed === receivedSignature;
}

export function verifyPayFastMerchant(body: Record<string, string>): boolean {
  return (
    body.merchant_id === process.env.PAYFAST_MERCHANT_ID
  );
}

const PAYFAST_SANDBOX_IPS = [
  "197.97.145.144",
  "197.97.145.145",
  "197.97.145.146",
  "197.97.145.147",
  "197.97.145.148",
  "197.97.145.149",
  "197.97.145.150",
  "197.97.145.151",
];
const PAYFAST_LIVE_IPS = [
  "197.97.145.144",
  "197.97.145.145",
  "197.97.145.146",
  "197.97.145.147",
  "197.97.145.148",
  "197.97.145.149",
  "197.97.145.150",
  "197.97.145.151",
];

export function isValidPayFastIP(ip: string): boolean {
  const validIPs =
    process.env.PAYFAST_SANDBOX === "true"
      ? PAYFAST_SANDBOX_IPS
      : PAYFAST_LIVE_IPS;
  return validIPs.includes(ip);
}
