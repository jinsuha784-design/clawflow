export const metadata = { title: "ClawFlow MCP Server" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", background: "#0a0a0f", color: "#e4e4e7" }}>
        {children}
      </body>
    </html>
  );
}
