"use client";

import { Box, Container } from "@mui/material";
import dynamic from "next/dynamic";

const AdminBootstrapSetup = dynamic(
  () => import("@/components/admin/AdminBootstrapSetup").then((m) => ({ default: m.AdminBootstrapSetup })),
  { ssr: false, loading: () => <div>Loading...</div> },
);

export default function AdminBootstrapPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AdminBootstrapSetup />
      </Box>
    </Container>
  );
}
