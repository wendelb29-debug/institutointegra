import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

type PaymentMethod = {
  id: string;
  nome: string;
  max_parcelas: number;
  taxa: number;
  dia_recebimento: number;
};

const FormasPagamento = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [nome, setNome] = useState("");
  const [maxParcelas, setMaxParcelas] = useState("1");
  const [taxa, setTaxa] = useState("0");
  const [diaRecebimento, setDiaRecebimento] = useState("1");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["payment_methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        max_parcelas: parseInt(maxParcelas) || 1,
        taxa: parseFloat(taxa) || 0,
        dia_recebimento: parseInt(diaRecebimento) || 1,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("payment_methods").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_methods").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success(editing ? "Atualizado!" : "Criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Excluído!");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setNome("");
    setMaxParcelas("1");
    setTaxa("0");
    setDiaRecebimento("1");
  };

  const openEdit = (item: PaymentMethod) => {
    setEditing(item);
    setNome(item.nome);
    setMaxParcelas(String(item.max_parcelas));
    setTaxa(String(item.taxa));
    setDiaRecebimento(String(item.dia_recebimento));
    setDialogOpen(true);
  };

  const filtered = items.filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Formas de Pagamento</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Criar nova
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
              <TableHead>Nº máx. parcelas</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Dia de recebimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.max_parcelas}</TableCell>
                  <TableCell>{Number(item.taxa).toFixed(2)}</TableCell>
                  <TableCell>{item.dia_recebimento}</TableCell>
                  <TableCell className="text-right space-x-2">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Forma de Pagamento" : "Forma de Pagamento - Inserindo novo registro"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nº máx. de parcelas</Label>
              <Input type="number" value={maxParcelas} onChange={(e) => setMaxParcelas(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Taxa (%)</Label>
              <Input type="number" step="0.01" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dia de recebimento</Label>
              <Input type="number" value={diaRecebimento} onChange={(e) => setDiaRecebimento(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormasPagamento;
