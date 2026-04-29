export const metadata = {
  title: "Data Center Power Trainer",
  description: "Interactive data center electrical training app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
