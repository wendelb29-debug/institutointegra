import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Module = 'instituto' | 'coworking' | 'cadastros' | 'financeiro' | 'almoxarifado';
export type Action = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function usePermissions() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false, permissions: [] as Permission[] };

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
      if (isAdmin) return { isAdmin: true, permissions: [] as Permission[] };

      // Get user's access profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const accessProfileId = (profile as any)?.access_profile_id;
      if (!accessProfileId) return { isAdmin: false, permissions: [] as Permission[] };

      const { data: perms } = await (supabase as any)
        .from('profile_permissions')
        .select('module, can_view, can_create, can_edit, can_delete')
        .eq('profile_id', accessProfileId);

      return { isAdmin: false, permissions: (perms || []) as Permission[] };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = data?.isAdmin ?? false;
  const permissions = data?.permissions ?? [];

  const can = (module: Module, action: Action): boolean => {
    if (isAdmin) return true;
    const perm = permissions.find(p => p.module === module);
    return perm?.[action] ?? false;
  };

  const canViewModule = (module: Module) => can(module, 'can_view');

  return { isAdmin, permissions, isLoading, can, canViewModule };
}
