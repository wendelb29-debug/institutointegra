import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Building2, CreditCard } from 'lucide-react';

const Perfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    company: '',
    address: ''
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: user.email || '',
          phone: data.phone || '',
          cpf: data.cpf || '',
          company: data.company || '',
          address: data.address || ''
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        cpf: profile.cpf,
        company: profile.company,
        address: profile.address
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso.',
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais e de contato.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="premium-card rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9" 
                    value={profile.full_name} 
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-muted/20" 
                    value={profile.email} 
                    disabled 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9" 
                    value={profile.phone} 
                    onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9" 
                    value={profile.cpf} 
                    onChange={e => setProfile({ ...profile, cpf: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  value={profile.company} 
                  onChange={e => setProfile({ ...profile, company: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Endereço Completo</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  value={profile.address} 
                  onChange={e => setProfile({ ...profile, address: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card rounded-xl p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-semibold text-primary">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground truncate">{profile.full_name || 'Usuário'}</h3>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>

          <div className="premium-card rounded-xl p-6">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">Segurança</h4>
            <Button variant="outline" className="w-full text-xs" onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade de troca de senha disponível em breve.' })}>
              Alterar Senha
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
