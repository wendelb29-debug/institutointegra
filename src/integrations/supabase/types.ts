export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          numero: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          numero: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          numero?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          confirmation_sent: boolean
          created_at: string
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          psychologist_id: string
          reminder_sent: boolean
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          confirmation_sent?: boolean
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          psychologist_id: string
          reminder_sent?: boolean
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          confirmation_sent?: boolean
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          psychologist_id?: string
          reminder_sent?: boolean
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string
          geolocation: string | null
          id: string
          ip_address: string | null
          photo_url: string | null
          signature_data: string | null
          signed_at: string
          signer_cpf: string | null
          signer_email: string | null
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          photo_url?: string | null
          signature_data?: string | null
          signed_at?: string
          signer_cpf?: string | null
          signer_email?: string | null
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          photo_url?: string | null
          signature_data?: string | null
          signed_at?: string
          signer_cpf?: string | null
          signer_email?: string | null
          signer_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          contract_type: string | null
          created_at: string
          end_date: string | null
          id: string
          monthly_value: number | null
          notes: string | null
          pdf_url: string | null
          room_id: string
          signed_at: string | null
          signing_token: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_value?: number | null
          notes?: string | null
          pdf_url?: string | null
          room_id: string
          signed_at?: string | null
          signing_token?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_value?: number | null
          notes?: string | null
          pdf_url?: string | null
          room_id?: string
          signed_at?: string | null
          signing_token?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          associar_ciap: string | null
          associar_cid: string | null
          associar_cipe: string | null
          created_at: string | null
          id: string
          nome: string
          texto: string | null
          updated_at: string | null
        }
        Insert: {
          associar_ciap?: string | null
          associar_cid?: string | null
          associar_cipe?: string | null
          created_at?: string | null
          id?: string
          nome: string
          texto?: string | null
          updated_at?: string | null
        }
        Update: {
          associar_ciap?: string | null
          associar_cid?: string | null
          associar_cipe?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          texto?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_paid: boolean | null
          paid_at: string | null
          partner_id: string | null
          room_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          partner_id?: string | null
          room_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          partner_id?: string | null
          room_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      instituto_events: {
        Row: {
          category: string | null
          created_at: string
          current_participants: number | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          instructor: string | null
          max_participants: number | null
          room_id: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          instructor?: string | null
          max_participants?: number | null
          room_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          instructor?: string | null
          max_participants?: number | null
          room_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instituto_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          maintenance_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          maintenance_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          maintenance_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_attachments_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          requested_by: string | null
          resolved_at: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          codigo_barras: string | null
          created_at: string | null
          descricao: string | null
          estoque_minimo: number
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          preco_unitario: number
          supplier_id: string | null
          unidade_medida: string | null
          updated_at: string | null
          validade: string | null
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          preco_unitario?: number
          supplier_id?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          preco_unitario?: number
          supplier_id?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_costs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          num_partners: number
          reference_month: string
          total_value: number
          value_per_partner: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          num_partners?: number
          reference_month: string
          total_value: number
          value_per_partner?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          num_partners?: number
          reference_month?: string
          total_value?: number
          value_per_partner?: number
        }
        Relationships: []
      }
      partner_invoices: {
        Row: {
          amount: number
          cost_id: string
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          partner_id: string
          payment_link: string | null
          reference_month: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          cost_id: string
          created_at?: string
          due_date: string
          id?: string
          paid_at?: string | null
          partner_id: string
          payment_link?: string | null
          reference_month: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cost_id?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          partner_id?: string
          payment_link?: string | null
          reference_month?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoices_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "partner_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invoices_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rooms: {
        Row: {
          id: string
          partner_id: string
          room_id: string
        }
        Insert: {
          id?: string
          partner_id: string
          room_id: string
        }
        Update: {
          id?: string
          partner_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rooms_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          share_percentage: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          share_percentage?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          share_percentage?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          avatar_url: string | null
          bairro: string | null
          carga_horaria_horas: number | null
          carga_horaria_minutos: number | null
          cep: string | null
          cidade: string | null
          cids_permanentes: string | null
          complemento: string | null
          convenio_padrao: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          data_nascimento_responsavel: string | null
          email: string | null
          estado: string | null
          estado_civil: string | null
          id: string
          id_prontuario: string | null
          name: string
          notes: string | null
          numero_carteirinha: string | null
          numero_endereco: string | null
          observacoes: string | null
          pais: string | null
          phone: string
          plano_saude: string | null
          profissao: string | null
          psychologist_id: string
          responsavel: string | null
          rua: string | null
          sexo: string | null
          telefone2: string | null
          telefone3: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          carga_horaria_horas?: number | null
          carga_horaria_minutos?: number | null
          cep?: string | null
          cidade?: string | null
          cids_permanentes?: string | null
          complemento?: string | null
          convenio_padrao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_nascimento_responsavel?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          id_prontuario?: string | null
          name: string
          notes?: string | null
          numero_carteirinha?: string | null
          numero_endereco?: string | null
          observacoes?: string | null
          pais?: string | null
          phone: string
          plano_saude?: string | null
          profissao?: string | null
          psychologist_id: string
          responsavel?: string | null
          rua?: string | null
          sexo?: string | null
          telefone2?: string | null
          telefone3?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          carga_horaria_horas?: number | null
          carga_horaria_minutos?: number | null
          cep?: string | null
          cidade?: string | null
          cids_permanentes?: string | null
          complemento?: string | null
          convenio_padrao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_nascimento_responsavel?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          id_prontuario?: string | null
          name?: string
          notes?: string | null
          numero_carteirinha?: string | null
          numero_endereco?: string | null
          observacoes?: string | null
          pais?: string | null
          phone?: string
          plano_saude?: string | null
          profissao?: string | null
          psychologist_id?: string
          responsavel?: string | null
          rua?: string | null
          sexo?: string | null
          telefone2?: string | null
          telefone3?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          dia_recebimento: number
          id: string
          max_parcelas: number
          nome: string
          taxa: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dia_recebimento?: number
          id?: string
          max_parcelas?: number
          nome: string
          taxa?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dia_recebimento?: number
          id?: string
          max_parcelas?: number
          nome?: string
          taxa?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      psychologist_whatsapp_config: {
        Row: {
          client_token: string | null
          created_at: string
          id: string
          instance_id: string
          is_connected: boolean
          psychologist_id: string
          token: string
          updated_at: string
        }
        Insert: {
          client_token?: string | null
          created_at?: string
          id?: string
          instance_id: string
          is_connected?: boolean
          psychologist_id: string
          token: string
          updated_at?: string
        }
        Update: {
          client_token?: string | null
          created_at?: string
          id?: string
          instance_id?: string
          is_connected?: boolean
          psychologist_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          payment_link: string | null
          payment_status: string
          room_id: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_value: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          payment_link?: string | null
          payment_status?: string
          room_id: string
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_value?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          payment_link?: string | null
          payment_status?: string
          room_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_value?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_day: number | null
          price_hour: number | null
          price_month: number | null
          status: Database["public"]["Enums"]["room_status"]
          type: Database["public"]["Enums"]["room_type"]
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_day?: number | null
          price_hour?: number | null
          price_month?: number | null
          status?: Database["public"]["Enums"]["room_status"]
          type?: Database["public"]["Enums"]["room_type"]
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_day?: number | null
          price_hour?: number | null
          price_month?: number | null
          status?: Database["public"]["Enums"]["room_status"]
          type?: Database["public"]["Enums"]["room_type"]
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          pais: string | null
          razao_social: string | null
          rua: string | null
          telefone1: string | null
          telefone2: string | null
          tipo_pessoa: string
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          pais?: string | null
          razao_social?: string | null
          rua?: string | null
          telefone1?: string | null
          telefone2?: string | null
          tipo_pessoa?: string
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          pais?: string | null
          razao_social?: string | null
          rua?: string | null
          telefone1?: string | null
          telefone2?: string | null
          tipo_pessoa?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          profile_pic_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          profile_pic_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          profile_pic_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          avatar_url: string | null
          conversation_status: string | null
          created_at: string | null
          id: string
          is_group: boolean | null
          is_online: boolean | null
          last_message: string | null
          last_message_time: string | null
          name: string | null
          phone: string
          profile_pic_url: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          avatar_url?: string | null
          conversation_status?: string | null
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          is_online?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string | null
          phone: string
          profile_pic_url?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          avatar_url?: string | null
          conversation_status?: string | null
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          is_online?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string | null
          phone?: string
          profile_pic_url?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          conversation_phone: string
          created_at: string | null
          direction: string
          from_me: boolean | null
          id: string
          message_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          conversation_phone: string
          created_at?: string | null
          direction: string
          from_me?: boolean | null
          id?: string
          message_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          conversation_phone?: string
          created_at?: string | null
          direction?: string
          from_me?: boolean | null
          id?: string
          message_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_phone_fkey"
            columns: ["conversation_phone"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["phone"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "socio" | "cliente"
      appointment_status: "agendado" | "confirmado" | "cancelado" | "realizado"
      contract_status: "ativo" | "encerrado" | "pendente"
      maintenance_status: "pendente" | "em_andamento" | "concluido"
      reservation_status: "confirmada" | "pendente" | "cancelada"
      room_status: "disponivel" | "ocupada" | "manutencao"
      room_type: "hora" | "diaria" | "mensal"
      transaction_type: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "socio", "cliente"],
      appointment_status: ["agendado", "confirmado", "cancelado", "realizado"],
      contract_status: ["ativo", "encerrado", "pendente"],
      maintenance_status: ["pendente", "em_andamento", "concluido"],
      reservation_status: ["confirmada", "pendente", "cancelada"],
      room_status: ["disponivel", "ocupada", "manutencao"],
      room_type: ["hora", "diaria", "mensal"],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const
