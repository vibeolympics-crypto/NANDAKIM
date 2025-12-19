import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ServiceWorkerNotifications } from '@/components/ServiceWorkerNotifications';
import { SkipLink } from '@/components/SkipLink';
import { BackToTopButton } from '@/components/BackToTopButton';
import { MusicPlayer } from '@/components/MusicPlayer';

// Eagerly load the main public page
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SkipLink />
      <Toaster />
      <Sonner />
      <ServiceWorkerNotifications />
      <BackToTopButton />
      <MusicPlayer position="bottom-left" autoplay={false} defaultVolume={70} />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
