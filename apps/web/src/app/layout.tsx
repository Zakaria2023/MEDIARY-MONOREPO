import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mediary",
  description: "Your entertainment, beautifully tracked.",
};

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => (
  <html lang="en" className="h-full antialiased">
    <body className="min-h-full flex flex-col">{children}</body>
  </html>
);

export default RootLayout;
