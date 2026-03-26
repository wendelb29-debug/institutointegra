import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutTemplate, Plus, Star, StarOff, Pencil, Trash2, Search
} from 'lucide-react';
import { useEffect } from 'react';

// Built-in templates
const builtInTemplates = [
  {
    id: 'terapia_sessao',
    category: 'terapia',
    name: 'Sessão Padrão - Terapia',
    text: `QUEIXA PRINCIPAL:\n[Descrever a queixa principal do paciente]\n\nEVOLUÇÃO:\n[Descrever a evolução observada durante a sessão]\n\nCONDUTA:\n[Descrever a conduta adotada e orientações]`,
    isFavorite: false,
  },
  {
    id: 'estetica_limpeza',
    category: 'estetica',
    name: 'Limpeza de Pele',
    text: `PROCEDIMENTO REALIZADO:\nLimpeza de pele profunda\n\nPRODUTOS UTILIZADOS:\n[Listar produtos]\n\nREAÇÃO DO PACIENTE:\n[Descrever reações observadas]\n\nORIENTAÇÕES:\n- Evitar exposição solar por 48h\n- Usar protetor solar FPS 50+\n- Hidratação adequada`,
    isFavorite: false,
  },
  {
    id: 'estetica_facial',
    category: 'estetica',
    name: 'Tratamento Facial',
    text: `PROCEDIMENTO REALIZADO:\n[Tipo de tratamento facial]\n\nÁREA TRATADA:\n[Especificar área]\n\nPRODUTOS UTILIZADOS:\n[Listar produtos e concentrações]\n\nPARÂMETROS:\n[Especificar parâmetros do equipamento, se aplicável]\n\nREAÇÃO:\n[Descrever reações]\n\nORIENTAÇÕES PÓS-PROCEDIMENTO:\n[Listar orientações]`,
    isFavorite: false,
  },
  {
    id: 'estetica_corporal',
    category: 'estetica',
    name: 'Tratamento Corporal',
    text: `PROCEDIMENTO REALIZADO:\n[Tipo de tratamento corporal]\n\nÁREA TRATADA:\n[Especificar região do corpo]\n\nMEDIDAS PRÉ-PROCEDIMENTO:\n[Medidas se aplicável]\n\nPRODUTOS/EQUIPAMENTOS:\n[Listar]\n\nREAÇÃO:\n[Descrever]\n\nORIENTAÇÕES:\n[Listar orientações]`,
    isFavorite: false,
  },
  {
    id: 'diagnostico_padrao',
    category: 'diagnostico',
    name: 'Diagnóstico Padrão',
    text: `DESCRIÇÃO DO QUADRO:\n[Descrever o quadro clínico apresentado pelo paciente]\n\nANÁLISE:\n[Análise detalhada dos sinais e sintomas]\n\nPLANO DE TRATAMENTO:\n[Descrever o plano de tratamento proposto, incluindo frequência e duração estimada]`,
    isFavorite: false,
  },
  {
    id: 'evolucao_padrao',
    category: 'terapia',
    name: 'Evolução de Sessão',
    text: `ESTADO GERAL DO PACIENTE:\n[Descrever estado emocional/físico ao chegar]\n\nTEMAS ABORDADOS:\n[Listar principais temas discutidos]\n\nINTERVENÇÕES REALIZADAS:\n[Descrever técnicas e intervenções]\n\nOBSERVAÇÕES:\n[Observações relevantes]\n\nPLANO PARA PRÓXIMA SESSÃO:\n[Objetivos e temas para a próxima sessão]`,
    isFavorite: false,
  },
];

interface TemplatesPanelProps {
  onInsert: (text: string) => void;
  context?: 'prontuario' | 'diagnostico' | 'all';
}

export function TemplatesPanel({ onInsert, context = 'all' }: TemplatesPanelProps) {
  const [open, setOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', nome: '', texto: '' });
  const [tab, setTab] = useState('todos');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomTemplates = async () => {
    const { data } = await supabase
      .from('document_templates')
      .select('*')
      .order('nome');
    setCustomTemplates(data || []);
  };

  useEffect(() => {
    if (open) fetchCustomTemplates();
    // Load favorites from localStorage
    const saved = localStorage.getItem('template_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, [open]);

  const allTemplates = [
    ...builtInTemplates.map(t => ({
      id: t.id,
      nome: t.name,
      texto: t.text,
      category: t.category,
      isBuiltIn: true,
    })),
    ...customTemplates.map(t => ({
      id: t.id,
      nome: t.nome,
      texto: t.texto || '',
      category: 'personalizado',
      isBuiltIn: false,
    })),
  ];

  const filteredTemplates = allTemplates.filter(t => {
    const matchesSearch = t.nome.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'todos' ||
      (tab === 'favoritos' && favorites.includes(t.id)) ||
      (tab === 'terapia' && t.category === 'terapia') ||
      (tab === 'estetica' && t.category === 'estetica') ||
      (tab === 'diagnostico' && t.category === 'diagnostico') ||
      (tab === 'personalizado' && t.category === 'personalizado');
    const matchesContext = context === 'all' ||
      (context === 'diagnostico' && (t.category === 'diagnostico' || t.category === 'personalizado')) ||
      (context === 'prontuario' && t.category !== 'diagnostico');
    return matchesSearch && matchesTab && matchesContext;
  });

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('template_favorites', JSON.stringify(next));
  };

  const handleInsert = (texto: string) => {
    onInsert(texto);
    setOpen(false);
    toast({ title: 'Modelo inserido!' });
  };

  const handleSaveCustom = async () => {
    if (!editForm.nome.trim()) return;
    if (editForm.id) {
      await supabase.from('document_templates').update({ nome: editForm.nome, texto: editForm.texto }).eq('id', editForm.id);
      toast({ title: 'Modelo atualizado!' });
    } else {
      await supabase.from('document_templates').insert({ nome: editForm.nome, texto: editForm.texto });
      toast({ title: 'Modelo criado!' });
    }
    setEditOpen(false);
    setEditForm({ id: '', nome: '', texto: '' });
    fetchCustomTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('document_templates').delete().eq('id', id);
    toast({ title: 'Modelo excluído!' });
    fetchCustomTemplates();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate className="h-4 w-4" />
        Inserir Modelo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Modelos Pré-prontos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="sm" className="gap-1" onClick={() => { setEditForm({ id: '', nome: '', texto: '' }); setEditOpen(true); }}>
                <Plus className="h-3.5 w-3.5" />
                Novo
              </Button>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
                <TabsTrigger value="favoritos" className="text-xs">⭐ Favoritos</TabsTrigger>
                <TabsTrigger value="terapia" className="text-xs">Terapia</TabsTrigger>
                <TabsTrigger value="estetica" className="text-xs">Estética</TabsTrigger>
                <TabsTrigger value="diagnostico" className="text-xs">Diagnóstico</TabsTrigger>
                <TabsTrigger value="personalizado" className="text-xs">Personalizados</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-3">
                {filteredTemplates.map(t => (
                  <div key={t.id} className="border border-border/60 rounded-lg p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t.nome}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {t.category === 'terapia' ? 'Terapia' :
                           t.category === 'estetica' ? 'Estética' :
                           t.category === 'diagnostico' ? 'Diagnóstico' : 'Personalizado'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFavorite(t.id)}>
                          {favorites.includes(t.id) ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> : <StarOff className="h-3.5 w-3.5" />}
                        </Button>
                        {!t.isBuiltIn && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditForm({ id: t.id, nome: t.nome, texto: t.texto }); setEditOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-2">{t.texto}</pre>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleInsert(t.texto)}>
                      Inserir Modelo
                    </Button>
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground text-sm">Nenhum modelo encontrado.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editForm.id ? 'Editar' : 'Novo'} Modelo Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} placeholder="Ex: Sessão de Acupuntura" />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo do Modelo</Label>
              <Textarea rows={10} value={editForm.texto} onChange={e => setEditForm({ ...editForm, texto: e.target.value })} placeholder="Digite o texto do modelo..." />
            </div>
            <Button onClick={handleSaveCustom} className="w-full" disabled={!editForm.nome.trim()}>Salvar Modelo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
