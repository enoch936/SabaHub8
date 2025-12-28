"use client";

import ProtectedLayout from "../(protected)/layout";

export default function DashboardSectionLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
