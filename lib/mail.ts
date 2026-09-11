import { Resend } from "resend";

export async function sendVerifyEmail(to: string, token: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  const resend = new Resend(key);
  const base = process.env.APP_URL || "https://dority-fantasy-league.vercel.app";
  const url = base + "/verify?token=" + token;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Dority Fantasy League <beth.t@example.com>",
    to,
    subject: "Confirm your Dority Fantasy League account",
    html: "<p>Confirm your email for Dority Fantasy League.</p><p><a href=\"" + url + "\">Verify account</a></p>"
  });
}
