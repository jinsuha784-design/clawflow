import "./globals.css";

export const metadata = {
  title: "ClawFlow — Order flow, rebuilt for agents",
  description: "Agentic payment-for-order-flow. Sealed-bid price-improvement auctions on Byreal × Mantle.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-transparent text-ink antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
