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
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";

const emptyForm = {
  supplier_id: "",
  nome: "",
  descricao: "",
  marca: "",
  modelo: "",
  codigo_barras: "",
  unidade_medida: "",
  estoque_minimo: "0",
  preco_unitario: "0",
  validade: "",
};

const Materiais = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*, suppliers(nome)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        supplier_id: form.supplier_id || null,
        nome: form.nome,
        descricao: form.descricao || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        codigo_barras: form.codigo_barras || null,
        unidade_medida: form.unidade_medida || null,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        preco_unitario: parseFloat(form.preco_unitario) || 0,
        validade: form.validade || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("materials").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(editingId ? "Material atualizado!" : "Material criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material excluído!");
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
      supplier_id: item.supplier_id || "",
      nome: item.nome || "",
      descricao: item.descricao || "",
      marca: item.marca || "",
      modelo: item.modelo || "",
      codigo_barras: item.codigo_barras || "",
      unidade_medida: item.unidade_medida || "",
      estoque_minimo: String(item.estoque_minimo ?? 0),
      preco_unitario: String(item.preco_unitario ?? 0),
      validade: item.validade || "",
    });
    setDialogOpen(true);
  };

  const openView = (item: any) => {
    openEdit(item);
    setViewMode(true);
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const filtered = items.filter((i) =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.marca || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Materiais</h1>
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
              <TableHead>Fornecedor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Estoque mínimo</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum material encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.suppliers?.nome || "-"}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.marca || "-"}</TableCell>
                  <TableCell>{item.modelo || "-"}</TableCell>
                  <TableCell>{Number(item.estoque_minimo).toFixed(2)}</TableCell>
                  <TableCell>{item.validade || "-"}</TableCell>
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
              {viewMode ? "Visualizar Material" : editingId ? "Editar Material" : "Material - Inserindo novo registro"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!viewMode) saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Fornecedor(es)</Label>
              <Select value={form.supplier_id} onValueChange={(v) => updateField("supplier_id", v)} disabled={viewMode}>
                <SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} required disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} disabled={viewMode} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={form.marca} onChange={(e) => updateField("marca", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={form.modelo} onChange={(e) => updateField("modelo", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código de barras</Label>
              <Input value={form.codigo_barras} onChange={(e) => updateField("codigo_barras", e.target.value)} disabled={viewMode} />
            </div>
            <div className="space-y-2">
              <Label>Unidade de medida</Label>
              <Select value={form.unidade_medida} onValueChange={(v) => updateField("unidade_medida", v)} disabled={viewMode}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="litro">Litro</SelectItem>
                  <SelectItem value="metro">Metro</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque mínimo</Label>
                <Input type="number" step="0.01" value={form.estoque_minimo} onChange={(e) => updateField("estoque_minimo", e.target.value)} disabled={viewMode} />
              </div>
              <div className="space-y-2">
                <Label>Preço unitário atual</Label>
                <Input type="number" step="0.01" value={form.preco_unitario} onChange={(e) => updateField("preco_unitario", e.target.value)} disabled={viewMode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Validade</Label>
              <Input type="date" value={form.validade} onChange={(e) => updateField("validade", e.target.value)} disabled={viewMode} />
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

export default Materiais;
