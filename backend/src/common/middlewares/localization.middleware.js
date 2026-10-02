import { LANG } from "../enums/lang.enum.js";

export function localization(req, res, next) {
  const lang = req.headers["accept-language"]?.toLowerCase() ?? LANG.EN;

  const supportedLangs = Object.values(LANG);
  if (!supportedLangs.includes(lang)) {
    req.lang = LANG.EN;
  } else {
    req.lang = lang;
  }

  next();
}
