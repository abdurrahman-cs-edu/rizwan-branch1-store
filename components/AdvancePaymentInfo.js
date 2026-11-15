import { PAYMENT_DETAILS, SITE } from "@/lib/config";
import { urduFont } from "@/lib/fonts";

// Payment instructions for Advance orders: English + Urdu, with the shop's own accounts.
// Used on the checkout page (when Advance is chosen) and on the order confirmation page.
export default function AdvancePaymentInfo() {
  const bank = PAYMENT_DETAILS.bank;
  const jazz = PAYMENT_DETAILS.jazzcash;
  const easy = PAYMENT_DETAILS.easypaisa;
  const hasBank = bank.accountNumber || bank.iban;

  const rows = [];
  if (hasBank) {
    rows.push({
      label: "Bank",
      lines: [
        [bank.title, bank.accountTitle].filter(Boolean).join(" · "),
        bank.accountNumber && `Account No: ${bank.accountNumber}`,
        bank.iban && `IBAN: ${bank.iban}`,
      ].filter(Boolean),
    });
  }
  if (jazz.number) {
    rows.push({ label: "JazzCash", lines: [jazz.accountTitle, jazz.number].filter(Boolean) });
  }
  if (easy.number) {
    rows.push({ label: "Easypaisa", lines: [easy.accountTitle, easy.number].filter(Boolean) });
  }

  return (
    <div className="space-y-3 text-left text-sm text-stone-700">
      <p>
        Pay into any one of the accounts below, then send a clear photo or screenshot of your payment
        receipt on WhatsApp ({SITE.phone}) with your order number. Your order is processed only after
        your payment is confirmed.
      </p>

      {rows.length > 0 ? (
        <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {rows.map((r) => (
            <div key={r.label} className="px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{r.label}</p>
              {r.lines.map((line, i) => (
                <p key={i} className="select-all text-[15px] text-stone-900">{line}</p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p>Our payment account details will be shared with you on WhatsApp.</p>
      )}

      <div
        dir="rtl"
        lang="ur"
        className={`${urduFont.className} rounded-lg border border-stone-200 bg-white px-4 py-3 text-right text-[15px] leading-[2.3] text-stone-900`}
      >
        <p className="font-bold">🧾 ایڈوانس ادائیگی – ہدایات</p>
        <p>ایڈوانس ادائیگی کا آپشن منتخب کرنے کا شکریہ۔</p>
        <p>
          براہ کرم اوپر دیے گئے اکاؤنٹ میں ادائیگی کریں اور ادائیگی کی رسید کی واضح تصویر یا اسکرین شاٹ فوراً
          واٹس ایپ نمبر <span dir="ltr" className="whitespace-nowrap">{SITE.phone}</span> پر بھیج دیں تاکہ آپ کا
          آرڈر کنفرم کیا جا سکے۔
        </p>
        <p className="font-bold">نوٹ: آپ کا آرڈر صرف ادائیگی کی تصدیق کے بعد ہی پروسیس کیا جائے گا۔</p>
      </div>
    </div>
  );
}
