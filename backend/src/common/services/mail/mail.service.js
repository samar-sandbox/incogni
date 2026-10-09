import config from "../../../config/config.js";
import { MAIL_SUBJECT, MAIL_DETAILS } from "../../enums/email.enum.js";
import { transporter } from "./mail.connection.js";
import {
  confirmEmailTemplate,
  resetPasswordTemplate,
  twoStepVerificationTemplate,
} from "./mail.template.js";

function getTemplate({ subject, name, otp }) {
  const { title = "Notification", expiresIn = 3 * 60 } = MAIL_DETAILS[subject];

  const templateData = { title, name, otp, expiresInMin: expiresIn / 60 };

  switch (subject) {
    case MAIL_SUBJECT.CONFIRMATION:
      return {
        subject: title,
        html: confirmEmailTemplate(templateData),
      };
    case MAIL_SUBJECT.RESET_PASSWORD:
      return {
        subject: title,
        html: resetPasswordTemplate(templateData),
      };
    case MAIL_SUBJECT.VERIFICATION:
      return {
        subject: title,
        html: twoStepVerificationTemplate(templateData),
      };
    default:
      return { subject: "Incogni", text: "Notification" };
  }
}

export async function sendMail({ email, subject, name, otp }) {
  try {
    const info = await transporter.sendMail({
      from: `"Incogni" <${config.googleMail.user}>`,
      to: email,
      ...getTemplate({ subject, name, otp }),
    });

    console.log("Message sent ", info.messageId);
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}
