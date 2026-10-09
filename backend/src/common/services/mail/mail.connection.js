import nodemailer from "nodemailer";
import config from "../../../config/config.js";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.googleMail.user,
    pass: config.googleMail.password,
  },
});

export async function verifyMailConnection() {
  console.log("Verifying mail server connection...");

  await transporter.verify();

  console.log("Mail server is ready to take our messages");
}
