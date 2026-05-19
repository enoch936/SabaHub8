import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Bootstrap Setup - SabaHub",
  description: "Initialize the first administrator account for the platform",
};

export default function AdminBootstrapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
