import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  role_title: string | null;
  signature_url: string | null;
}

export function useProfessionalProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('health_professionals' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const saveProfile = async (updates: Partial<ProfessionalProfile>) => {
    if (!user) return null;
    if (profile) {
      const { data, error } = await supabase
        .from('health_professionals' as any)
        .update(updates as any)
        .eq('id', profile.id)
        .select()
        .single();
      if (!error) setProfile(data as any);
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('health_professionals' as any)
        .insert({ user_id: user.id, full_name: '', specialty: '', ...updates } as any)
        .select()
        .single();
      if (!error) setProfile(data as any);
      return { data, error };
    }
  };

  const uploadSignature = async (dataUrl: string) => {
    if (!user) return null;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${user.id}/signature_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage.from('signatures').upload(path, blob, { upsert: true });
    if (uploadError) return null;
    const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path);
    await saveProfile({ signature_url: urlData.publicUrl });
    return urlData.publicUrl;
  };

  return { profile, loading, saveProfile, uploadSignature, refetch: fetchProfile };
}
