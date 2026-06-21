import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// Initialize Plugin SDK
declare global {
  interface Window {
    __HERMES_PLUGIN_SDK__: any;
  }
}
window.__HERMES_PLUGIN_SDK__ = {
  addSidebarTab: (_id: string, _icon: any, label: string, _component: any) => {
    console.log(`[SDK] Sidebar tab registered: ${label}`);
  },
  addHeaderWidget: (id: string, _component: any) => {
    console.log(`[SDK] Header widget registered: ${id}`);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
