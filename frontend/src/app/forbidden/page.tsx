import Link from "next/link";
import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";

export default function Forbidden() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h4" fontWeight={800}>403 - Forbidden</Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
              You do not have permission to access this resource.
            </Typography>
            <Link href="/jobs" style={{ textDecoration: "none" }}>
              <Button variant="contained">Go back</Button>
            </Link>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
