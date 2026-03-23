import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Eye, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const emptyForm = {
  name: "",
  responsavel: "",
  estado_civil: "",
  cpf: "",
  profissao: "",
  cep: "",
  rua: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  estado: "",
  cidade: "",
  pais: "Brasil",
  phone: "",
  telefone2: "",
  telefone3: "",
  convenio_padrao: "",
  plano_saude: "",
  numero_carteirinha: "",
  email: "",
  data_nascimento: "",
  sexo: "",
  data_nascimento_responsavel: "",
  carga_horaria_horas: "0",
  carga_horaria_minutos: "0",
  cids_permanentes: "",
  observacoes: "",
};

const Pacientes = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["patients_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        phone: form.phone || "",
        email: form.email || null,
        cpf: form.cpf || null,
        responsavel: form.responsavel || null,
        estado_civil: form.estado_civil || null,
        profissao: form.profissao || null,
        cep: form.cep || null,
        rua: form.rua || null,
        numero_endereco: form.numero_endereco || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        estado: form.estado || null,
        cidade: form.cidade || null,
        pais: form.pais || "Brasil",
        telefone2: form.telefone2 || null,
        telefone3: form.telefone3 || null,
        convenio_padrao: form.convenio_padrao || null,
        plano_saude: form.plano_saude || null,
        numero_carteirinha: form.numero_carteirinha || null,
        data_nascimento: form.data_nascimento || null,
        sexo: form.sexo || null,
        data_nascimento_responsavel: form.data_nascimento_responsavel || null,
        carga_horaria_horas: parseInt(form.carga_horaria_horas) || 0,
        carga_horaria_minutos: parseInt(form.carga_horaria_minutos) || 0,
        cids_permanentes: form.cids_permanentes || null,
        observacoes: form.observacoes || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("patients").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        payload.psychologist_id = user?.id || "";
        const { error } = await supabase.from("patients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients_full"] });
      toast.success(editingId ? "Paciente atualizado!" : "Paciente criado!");
      closeDialog();
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients_full"] });
      toast.success("Paciente excluído!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setViewMode(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      responsavel: item.responsavel || "",
      estado_civil: item.estado_civil || "",
      cpf: item.cpf || "",
      profissao: item.profissao || "",
      cep: item.cep || "",
      rua: item.rua || "",
      numero_endereco: item.numero_endereco || "",
      complemento: item.complemento || "",
      bairro: item.bairro || "",
      estado: item.estado || "",
      cidade: item.cidade || "",
      pais: item.pais || "Brasil",
      phone: item.phone || "",
      telefone2: item.telefone2 || "",
      telefone3: item.telefone3 || "",
      convenio_padrao: item.convenio_padrao || "",
      plano_saude: item.plano_saude || "",
      numero_carteirinha: item.numero_carteirinha || "",
      email: item.email || "",
      data_nascimento: item.data_nascimento || "",
      sexo: item.sexo || "",
      data_nascimento_responsavel: item.data_nascimento_responsavel || "",
      carga_horaria_horas: String(item.carga_horaria_horas ?? 0),
      carga_horaria_minutos: String(item.carga_horaria_minutos ?? 0),
      cids_permanentes: item.cids_permanentes || "",
      observacoes: item.observacoes || "",
    });
    setDialogOpen(true);
  };

  const openView = (item: any) => {
    openEdit(item);
    setViewMode(true);
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.cpf || "").includes(search) ||
      (i.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.phone || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Pacientes</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Criar novo
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button size="icon" variant="outline"><Search className="h-4 w-4" /></Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>ID pront.</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{item.id_prontuario || "-"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.responsavel || "-"}</TableCell>
                  <TableCell>{item.cpf || "-"}</TableCell>
                  <TableCell>{item.cidade || "-"}</TableCell>
                  <TableCell>{item.email || "-"}</TableCell>
                  <TableCell>{item.phone || "-"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="outline" onClick={() => openView(item)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? "Visualizar Paciente" : editingId ? "Editar Paciente" : "Paciente - Inserindo novo registro"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!viewMode) saveMutation.mutate(); }} className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl"><User className="h-10 w-10" /></AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Nome do responsável</Label>
              <Input value={form.responsavel} onChange={(e) => updateField("responsavel", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Estado civil</Label>
              <Select value={form.estado_civil} onValueChange={(v) => updateField("estado_civil", v)} disabled={viewMode}>
                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => updateField("cpf", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input value={form.profissao} onChange={(e) => updateField("profissao", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} disabled={viewMode} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input value={form.rua} onChange={(e) => updateField("rua", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Nº</Label>
                <Input value={form.numero_endereco} onChange={(e) => updateField("numero_endereco", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={form.complemento} onChange={(e) => updateField("complemento", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} disabled={viewMode} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={form.estado} onChange={(e) => updateField("estado", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={form.pais} onChange={(e) => updateField("pais", e.target.value)} disabled={viewMode} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Telefone 1</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Telefone 2</Label>
                <Input value={form.telefone2} onChange={(e) => updateField("telefone2", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Telefone 3</Label>
                <Input value={form.telefone3} onChange={(e) => updateField("telefone3", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Convênio padrão</Label>
                <Input value={form.convenio_padrao} onChange={(e) => updateField("convenio_padrao", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Plano de saúde</Label>
                <Input value={form.plano_saude} onChange={(e) => updateField("plano_saude", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número da carteirinha do convênio</Label>
              <Input value={form.numero_carteirinha} onChange={(e) => updateField("numero_carteirinha", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} disabled={viewMode} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={(e) => updateField("data_nascimento", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => updateField("sexo", v)} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento do responsável</Label>
              <Input type="date" value={form.data_nascimento_responsavel} onChange={(e) => updateField("data_nascimento_responsavel", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Carga horária limite mensal</Label>
              <div className="flex items-center gap-2">
                <Input type="number" className="w-20" value={form.carga_horaria_horas} onChange={(e) => updateField("carga_horaria_horas", e.target.value)} disabled={viewMode} />
                <span className="text-sm text-muted-foreground">h</span>
                <Input type="number" className="w-20" value={form.carga_horaria_minutos} onChange={(e) => updateField("carga_horaria_minutos", e.target.value)} disabled={viewMode} />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>CIDs permanentes</Label>
              <Input value={form.cids_permanentes} onChange={(e) => updateField("cids_permanentes", e.target.value)} placeholder="Insira um novo código ou selecione um já existente" disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} className="min-h-[150px]" disabled={viewMode} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>{viewMode ? "Fechar" : "Cancelar"}</Button>
              {!viewMode && <Button type="submit" disabled={saveMutation.isPending}>Salvar</Button>}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pacientes;
