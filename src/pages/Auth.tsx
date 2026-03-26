import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logoIntegra from '@/assets/logo_integra.png';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Auto-logout on tab close for web (non-mobile) when "remember me" is off
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return;

    const handleBeforeUnload = () => {
      if (!rememberMe) {
        sessionStorage.setItem('integra_tab_open', 'true');
      }
    };

    const handleLoad = () => {
      if (!rememberMe && !sessionStorage.getItem('integra_tab_open')) {
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    handleLoad();

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [rememberMe]);

  useEffect(() => {
    localStorage.setItem('rememberMe', String(rememberMe));
  }, [rememberMe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/gestao" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast({ title: 'Bem-vindo de volta!' });
      } else {
        await signUp(email, password, fullName);
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'E-mail enviado!', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
      setIsForgotPassword(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot password view
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto">
              <img src={logoIntegra} alt="Integra" className="h-16 w-auto mx-auto" />
            </div>
            <CardTitle className="text-xl font-display text-charcoal">Esqueceu a senha?</CardTitle>
            <CardDescription>Insira seu e-mail e enviaremos um link para redefinir sua senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">E-mail</Label>
                <Input id="resetEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Voltar ao login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </Link>
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto">
            <img src={logoIntegra} alt="Integra" className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-xl font-display text-charcoal">
            {isLogin ? 'Entrar no sistema' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Acesse o painel de gestão do Integra' : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-muted-foreground">
                    Lembrar-me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
              {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
