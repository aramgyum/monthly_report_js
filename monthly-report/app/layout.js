import "./globals.css";

export const metadata = {
  title: "Monthly Report Builder",
  description: "Executive monthly report tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
