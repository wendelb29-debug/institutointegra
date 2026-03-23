import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";

const emptyForm = {
  tipo_pessoa: "Física",
  nome: "",
  razao_social: "",
  email: "",
  cpf_cnpj: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  estado: "",
  cidade: "",
  pais: "Brasil",
  telefone1: "",
  telefone2: "",
};

const Fornecedores = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, updated_at: new Date().toISOString() };
      if (editingId) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor excluído!");
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
      tipo_pessoa: item.tipo_pessoa || "Física",
      nome: item.nome || "",
      razao_social: item.razao_social || "",
      email: item.email || "",
      cpf_cnpj: item.cpf_cnpj || "",
      cep: item.cep || "",
      rua: item.rua || "",
      numero: item.numero || "",
      complemento: item.complemento || "",
      bairro: item.bairro || "",
      estado: item.estado || "",
      cidade: item.cidade || "",
      pais: item.pais || "Brasil",
      telefone1: item.telefone1 || "",
      telefone2: item.telefone2 || "",
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
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      (i.cpf_cnpj || "").includes(search) ||
      (i.cidade || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Fornecedores</h1>
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
              <TableHead>Nome</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.razao_social}</TableCell>
                  <TableCell>{item.cpf_cnpj}</TableCell>
                  <TableCell>{item.cidade}</TableCell>
                  <TableCell className="text-right space-x-2">
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
              {viewMode ? "Visualizar Fornecedor" : editingId ? "Editar Fornecedor" : "Fornecedor - Inserindo novo registro"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!viewMode) saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de pessoa</Label>
              <Select value={form.tipo_pessoa} onValueChange={(v) => updateField("tipo_pessoa", v)} disabled={viewMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Física">Física</SelectItem>
                  <SelectItem value="Jurídica">Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} required disabled={viewMode} />
            </div>
            {form.tipo_pessoa === "Jurídica" && (
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={form.razao_social} onChange={(e) => updateField("razao_social", e.target.value)} disabled={viewMode} />
              </div>
            )}
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>{form.tipo_pessoa === "Jurídica" ? "CNPJ" : "CPF"}</Label>
              <Input value={form.cpf_cnpj} onChange={(e) => updateField("cpf_cnpj", e.target.value)} disabled={viewMode} />
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
                <Input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} disabled={viewMode} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone 1</Label>
                <Input value={form.telefone1} onChange={(e) => updateField("telefone1", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Telefone 2</Label>
                <Input value={form.telefone2} onChange={(e) => updateField("telefone2", e.target.value)} disabled={viewMode} />
              </div>
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

export default Fornecedores;
