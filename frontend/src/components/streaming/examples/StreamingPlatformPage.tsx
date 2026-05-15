import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import StreamingDashboard from '@/components/streaming/StreamingDashboard';
import { colors } from '@/components/streaming/theme';

/**
 * StreamingPlatformPage
 * 
 * Full-page demonstration of the StreamStudio live streaming platform.
 * This page showcases the complete streaming dashboard with all features enabled.
 * 
 * Usage:
 * - Navigate to this page in your application
 * - All streaming features are immediately available
 * - No additional setup required
 * 
 * Customization:
 * - Modify the theme colors in createTheme()
 * - Adjust responsive breakpoints as needed
 * - Connect to real backend APIs by modifying component state
 */

const StreamingPlatformPage: React.FC = () => {
  // Create a minimal Material-UI theme that complements the dark streaming theme
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: colors.accent,
      },
      secondary: {
        main: colors.accentLight,
      },
      background: {
        default: colors.primary,
        paper: colors.primaryLight,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
      },
      info: {
        main: '#3b82f6',
      },
      success: {
        main: colors.neonGreen,
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.primary,
            color: colors.textPrimary,
            fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: 'rgba(139, 92, 246, 0.05)',
          },
          '::-webkit-scrollbar-thumb': {
            background: 'rgba(139, 92, 246, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(139, 92, 246, 0.5)',
            },
          },
        },
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.primary} 0%, #0f172a 50%, #1a0033 100%)`,
        }}
      >
        <StreamingDashboard />
      </Box>
    </ThemeProvider>
  );
};

export default StreamingPlatformPage;

/**
 * INTEGRATION GUIDE
 * 
 * To use this page in your application:
 * 
 * 1. Router Setup (Next.js):
 *    ```
 *    // app/streaming/page.tsx
 *    import StreamingPlatformPage from '@/components/streaming/examples/StreamingPlatformPage';
 *    export default StreamingPlatformPage;
 *    ```
 * 
 * 2. Router Setup (React Router):
 *    ```
 *    import { Route } from 'react-router-dom';
 *    import StreamingPlatformPage from '@/components/streaming/examples/StreamingPlatformPage';
 *    
 *    <Route path="/streaming" element={<StreamingPlatformPage />} />
 *    ```
 * 
 * 3. Standalone Usage:
 *    ```
 *    import ReactDOM from 'react-dom';
 *    import StreamingPlatformPage from '@/components/streaming/examples/StreamingPlatformPage';
 *    
 *    ReactDOM.render(<StreamingPlatformPage />, document.getElementById('root'));
 *    ```
 * 
 * CONNECTING TO REAL BACKEND:
 * 
 * 1. Modify StreamingDashboard.tsx to accept props:
 *    ```tsx
 *    interface StreamingDashboardProps {
 *      streamId: string;
 *      userId: string;
 *      onStreamToggle?: (isStreaming: boolean) => void;
 *    }
 *    ```
 * 
 * 2. Connect chat messages to real API:
 *    ```tsx
 *    useEffect(() => {
 *      // Subscribe to real-time chat
 *      chatService.subscribe(streamId, (message) => {
 *        setMessages(prev => [...prev, message]);
 *      });
 *    }, [streamId]);
 *    ```
 * 
 * 3. Connect analytics to real metrics:
 *    ```tsx
 *    useEffect(() => {
 *      // Fetch real-time analytics
 *      const interval = setInterval(async () => {
 *        const data = await analyticsService.getMetrics(streamId);
 *        setAnalytics(data);
 *      }, 1000);
 *    }, [streamId]);
 *    ```
 * 
 * 4. Handle device connections:
 *    ```tsx
 *    const handleDeviceConnect = async (device: DeviceConfig) => {
 *      const result = await deviceService.connect(device);
 *      if (result.success) {
 *        setDevices(prev => [...prev, result.device]);
 *      }
 *    };
 *    ```
 * 
 * CUSTOMIZATION EXAMPLES:
 * 
 * 1. Change accent color:
 *    Edit theme.ts: colors.accent = '#your-color'
 * 
 * 2. Modify layout spacing:
 *    Edit theme.ts: spacing.lg = '20px'
 * 
 * 3. Change animations:
 *    Edit theme.ts: Add new keyframes or modify existing ones
 * 
 * 4. Add custom components:
 *    Create new components in components/ folder
 *    Import and add to StreamingDashboard.tsx
 * 
 * PERFORMANCE OPTIMIZATION:
 * 
 * 1. Lazy load heavy components:
 *    ```tsx
 *    const DeviceIntegration = React.lazy(() => import('./components/DeviceIntegration'));
 *    ```
 * 
 * 2. Optimize animations:
 *    - Use CSS transforms and opacity
 *    - Avoid layout-triggering properties
 *    - Use will-change sparingly
 * 
 * 3. Memoize components:
 *    ```tsx
 *    export default React.memo(StreamChat);
 *    ```
 * 
 * 4. Connection pooling:
 *    - Reuse WebSocket connections
 *    - Batch real-time updates
 *    - Use message debouncing
 * 
 * TESTING:
 * 
 * 1. Component testing:
 *    ```bash
 *    npm run test -- --testPathPattern=streaming
 *    ```
 * 
 * 2. Visual regression:
 *    ```bash
 *    npm run test:visual -- streaming
 *    ```
 * 
 * 3. Performance testing:
 *    Use Chrome DevTools Performance tab to profile
 */
