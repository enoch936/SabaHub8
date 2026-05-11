import Link from "next/link";
import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h4" fontWeight={800}>404 - Page not found</Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
              The page you are looking for does not exist or has been moved.
            </Typography>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button variant="outlined">Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
