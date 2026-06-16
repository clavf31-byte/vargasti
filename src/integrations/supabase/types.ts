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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          created_at: string
          data_criacao: string
          data_leitura: string | null
          id: string
          lido: boolean
          mensagem: string
          orcamento_id: string | null
          severidade: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_criacao?: string
          data_leitura?: string | null
          id?: string
          lido?: boolean
          mensagem: string
          orcamento_id?: string | null
          severidade?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_criacao?: string
          data_leitura?: string | null
          id?: string
          lido?: boolean
          mensagem?: string
          orcamento_id?: string | null
          severidade?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_tags: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_tags_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          tags: string[]
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_pauses: {
        Row: {
          created_at: string
          from_number: string
          id: string
          instance_name: string
          is_group: boolean
          paused_at: string
          resume_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_number: string
          id?: string
          instance_name: string
          is_group: boolean
          paused_at?: string
          resume_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_number?: string
          id?: string
          instance_name?: string
          is_group?: boolean
          paused_at?: string
          resume_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          orcamento_id: string | null
          recipient: string
          sent_at: string
          status: string
          subject: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          orcamento_id?: string | null
          recipient: string
          sent_at?: string
          status?: string
          subject: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          orcamento_id?: string | null
          recipient?: string
          sent_at?: string
          status?: string
          subject?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processing_log: {
        Row: {
          created_at: string
          email_id: string
          error: string | null
          id: string
          status: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          email_id: string
          error?: string | null
          id?: string
          status: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          email_id?: string
          error?: string | null
          id?: string
          status?: string
          ticket_id?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          categories: Json
          created_at: string
          id: string
          priorities: Json
          updated_at: string
          whitelist: Json
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          priorities?: Json
          updated_at?: string
          whitelist?: Json
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          priorities?: Json
          updated_at?: string
          whitelist?: Json
        }
        Relationships: []
      }
      file_records: {
        Row: {
          created_at: string | null
          file_type: string | null
          id: string
          name: string
          origin: string | null
          size_bytes: number | null
          storage_path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          name?: string
          origin?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          name?: string
          origin?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gmail_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kb_articles: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notas_fiscais: {
        Row: {
          cliente_id: string
          created_at: string
          data_emissao: string
          id: string
          numero: string
          orcamento_id: string
          pdf_url: string | null
          status: string
          updated_at: string
          valor_total: number
          xml_url: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_emissao: string
          id?: string
          numero: string
          orcamento_id: string
          pdf_url?: string | null
          status?: string
          updated_at?: string
          valor_total: number
          xml_url?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_emissao?: string
          id?: string
          numero?: string
          orcamento_id?: string
          pdf_url?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          status: string | null
          tags: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          tags?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          tags?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          cliente_id: string
          created_at: string
          data_fechamento_esperada: string | null
          descricao: string | null
          etapa_data: string | null
          id: string
          motivo_perda: string | null
          probabilidade: number | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fechamento_esperada?: string | null
          descricao?: string | null
          etapa_data?: string | null
          id?: string
          motivo_perda?: string | null
          probabilidade?: number | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fechamento_esperada?: string | null
          descricao?: string | null
          etapa_data?: string | null
          id?: string
          motivo_perda?: string | null
          probabilidade?: number | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          preco_unitario: number
          quantidade: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          alerta_enviado: boolean
          cliente_id: string
          created_at: string
          data_criacao: string
          data_vencimento: string | null
          id: string
          notas: string | null
          numero: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_enviado?: boolean
          cliente_id: string
          created_at?: string
          data_criacao?: string
          data_vencimento?: string | null
          id?: string
          notas?: string | null
          numero: string
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alerta_enviado?: boolean
          cliente_id?: string
          created_at?: string
          data_criacao?: string
          data_vencimento?: string | null
          id?: string
          notas?: string | null
          numero?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string
          id: string
          metodo: string | null
          orcamento_id: string
          referencia: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          id?: string
          metodo?: string | null
          orcamento_id: string
          referencia?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          id?: string
          metodo?: string | null
          orcamento_id?: string
          referencia?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          links: string | null
          name: string
          observations: string | null
          status: string | null
          technologies: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          links?: string | null
          name?: string
          observations?: string | null
          status?: string | null
          technologies?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          links?: string | null
          name?: string
          observations?: string | null
          status?: string | null
          technologies?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          cliente_id: string | null
          concluida_em: string | null
          created_at: string
          data_vencimento: string
          descricao: string | null
          id: string
          orcamento_id: string | null
          prioridade: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          concluida_em?: string | null
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          id?: string
          orcamento_id?: string | null
          prioridade?: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          concluida_em?: string | null
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          id?: string
          orcamento_id?: string | null
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_permissions: {
        Row: {
          can_access_crm: boolean
          can_access_email: boolean
          can_access_excel: boolean
          can_access_files: boolean
          can_access_notes: boolean
          can_access_projects: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access_crm?: boolean
          can_access_email?: boolean
          can_access_excel?: boolean
          can_access_files?: boolean
          can_access_notes?: boolean
          can_access_projects?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access_crm?: boolean
          can_access_email?: boolean
          can_access_excel?: boolean
          can_access_files?: boolean
          can_access_notes?: boolean
          can_access_projects?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          auto_reply: boolean | null
          claude_system_prompt: string | null
          created_at: string | null
          evolution_key: string
          evolution_url: string
          group_system_prompt: string | null
          id: string
          instance_name: string
          label: string
          reply_to_groups: boolean | null
          save_as_notes: boolean | null
          updated_at: string | null
          user_id: string
          webhook_token: string | null
        }
        Insert: {
          auto_reply?: boolean | null
          claude_system_prompt?: string | null
          created_at?: string | null
          evolution_key?: string
          evolution_url?: string
          group_system_prompt?: string | null
          id?: string
          instance_name?: string
          label?: string
          reply_to_groups?: boolean | null
          save_as_notes?: boolean | null
          updated_at?: string | null
          user_id: string
          webhook_token?: string | null
        }
        Update: {
          auto_reply?: boolean | null
          claude_system_prompt?: string | null
          created_at?: string | null
          evolution_key?: string
          evolution_url?: string
          group_system_prompt?: string | null
          id?: string
          instance_name?: string
          label?: string
          reply_to_groups?: boolean | null
          save_as_notes?: boolean | null
          updated_at?: string | null
          user_id?: string
          webhook_token?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          direction: string | null
          from_name: string | null
          from_number: string | null
          id: string
          instance_name: string | null
          message: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          direction?: string | null
          from_name?: string | null
          from_number?: string | null
          id?: string
          instance_name?: string | null
          message?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string | null
          from_name?: string | null
          from_number?: string | null
          id?: string
          instance_name?: string | null
          message?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
