import { Suspense } from "react";
import { Box, Container } from "@mui/material";
import { AdminBootstrapSetup } from "@/components/admin/AdminBootstrapSetup";

export const metadata = {
  title: "Admin Bootstrap Setup - SabaHub",
  description: "Initialize the first administrator account for the platform",
};

export default function AdminBootstrapPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Suspense fallback={<div>Loading...</div>}>
          <AdminBootstrapSetup />
        </Suspense>
      </Box>
    </Container>
  );
}
