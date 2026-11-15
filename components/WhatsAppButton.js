import { waLink } from "@/lib/products";
import { SITE } from "@/lib/config";

export default function WhatsAppButton() {
  const href = waLink(`Hello ${SITE.name}, I have a question.`);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-green-700"
    >
      <span aria-hidden>💬</span>
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
