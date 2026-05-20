import { Box, Container, Typography, Divider } from "@mui/material";
import { HeroAnalyticsSection } from "@/components/dashboard/HeroAnalyticsSection";
import { AdvancedChartsSection } from "@/components/dashboard/AdvancedChartsSection";
import { Analytics } from "@/components/workspace-wallet/Analytics";

export default function AnalyticsPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={900} gutterBottom>
          Platform Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
          Comprehensive oversight of platform health, user activity, financial performance, and AI operations.
        </Typography>
      </Box>

      <HeroAnalyticsSection />
      
      <Divider sx={{ my: 6, opacity: 0.1 }} />
      
      <AdvancedChartsSection />

      <Divider sx={{ my: 6, opacity: 0.1 }} />

      <Box sx={{ mt: 4 }}>
        <Analytics />
      </Box>
    </Container>
  );
}
