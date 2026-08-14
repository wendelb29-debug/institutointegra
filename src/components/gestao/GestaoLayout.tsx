import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { FloatingChatAssistant } from './FloatingChatAssistant';
import { Bell, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const GestaoLayout = () => {
  const { user, loading } = useAuth();
  const [profileName, setProfileName] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    
    // Aplicar dark mode ao entrar na gestão
    document.documentElement.classList.add('dark');
    
    supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setProfileName(data.full_name);
      });

    return () => {
      // Opcional: remover ao sair da gestão
      // document.documentElement.classList.remove('dark');
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const displayName = profileName || user.email?.split('@')[0] || 'Usuário';

  return (
    <SidebarProvider>
      <div className="gestao-theme min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 bg-card/40 backdrop-blur-md px-4 md:px-6 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-display tracking-wide text-foreground">Integra</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-l border-border/50 pl-2 ml-1">Gestão</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-lg"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:inline truncate max-w-36">
                  {displayName}
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8 min-h-0" style={{ height: 'calc(100dvh - 3.5rem)', maxHeight: 'calc(100dvh - 3.5rem)' }}>
            <Outlet />
          </main>
          <FloatingChatAssistant />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default GestaoLayout;
