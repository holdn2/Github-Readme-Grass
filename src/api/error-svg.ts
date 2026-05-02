import { escapeSvgText } from "../render/escape";

export function renderErrorSvg(title: string, message: string): string {
  const safeTitle = escapeSvgText(title);
  const safeMessage = escapeSvgText(message);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120" viewBox="0 0 520 120" role="img" aria-labelledby="title"><title id="title">${safeTitle}</title><style>.title{font:600 16px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#3b2f2a}.message{font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#6b4a3a}</style><rect width="100%" height="100%" rx="6" fill="#fff7ed"/><rect x="16" y="16" width="488" height="88" rx="6" fill="#fef2f2" stroke="#f4b4a7"/><text x="32" y="50" class="title">${safeTitle}</text><text x="32" y="76" class="message">${safeMessage}</text></svg>`;
}
