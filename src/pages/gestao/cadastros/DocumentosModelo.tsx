import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

type DocTemplate = {
  id: string;
  nome: string;
  associar_cid: string | null;
  associar_ciap: string | null;
  associar_cipe: string | null;
  texto: string | null;
};

const DocumentosModelo = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocTemplate | null>(null);
  const [nome, setNome] = useState("");
  const [cid, setCid] = useState("");
  const [ciap, setCiap] = useState("");
  const [cipe, setCipe] = useState("");
  const [texto, setTexto] = useState("");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["document_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
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
        associar_cid: cid || null,
        associar_ciap: ciap || null,
        associar_cipe: cipe || null,
        texto: texto || null,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase
          .from("document_templates")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("document_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast.success(editing ? "Documento atualizado!" : "Documento criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar documento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast.success("Documento excluído!");
    },
    onError: () => toast.error("Erro ao excluir documento."),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setNome("");
    setCid("");
    setCiap("");
    setCipe("");
    setTexto("");
  };

  const openEdit = (doc: DocTemplate) => {
    setEditing(doc);
    setNome(doc.nome);
    setCid(doc.associar_cid || "");
    setCiap(doc.associar_ciap || "");
    setCipe(doc.associar_cipe || "");
    setTexto(doc.texto || "");
    setDialogOpen(true);
  };

  const filtered = docs.filter((d) =>
    d.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Modelo de Documento</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Criar novo
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="icon" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.nome}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline" onClick={() => openEdit(doc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Modelo de Documento" : "Modelo de Documento - Novo"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Associar CID</Label>
              <Input
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="Insira um novo código ou selecione um já existente"
              />
            </div>
            <div className="space-y-2">
              <Label>Associar CIAP</Label>
              <Input
                value={ciap}
                onChange={(e) => setCiap(e.target.value)}
                placeholder="Selecione ou pesquise"
              />
            </div>
            <div className="space-y-2">
              <Label>Associar CIPE</Label>
              <Input
                value={cipe}
                onChange={(e) => setCipe(e.target.value)}
                placeholder="Selecione ou pesquise"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="min-h-[200px]"
                placeholder="Digite o conteúdo do documento..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentosModelo;
