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
      chamado_comentarios: {
        Row: {
          chamado_id: string
          conteudo: string
          created_at: string
          id: string
          metadata: Json | null
          tipo: string
          user_id: string
        }
        Insert: {
          chamado_id: string
          conteudo: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tipo?: string
          user_id: string
        }
        Update: {
          chamado_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_comentarios_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          anotacoes: string | null
          cliente_id: string | null
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          numero_formatado: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          cliente_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          numero_formatado?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacoes?: string | null
          cliente_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          numero_formatado?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_financeiro: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          qtd_nf: number
          qtd_orcamentos: number
          qtd_os: number
          total_aberto: number
          total_nf: number
          total_orcamentos: number
          total_os: number
          total_pago: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          qtd_nf?: number
          qtd_orcamentos?: number
          qtd_os?: number
          total_aberto?: number
          total_nf?: number
          total_orcamentos?: number
          total_os?: number
          total_pago?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          qtd_nf?: number
          qtd_orcamentos?: number
          qtd_os?: number
          total_aberto?: number
          total_nf?: number
          total_orcamentos?: number
          total_os?: number
          total_pago?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_financeiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
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
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          contato: string | null
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
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
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
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
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
      contract_templates: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          user_id: string
          variaveis: Json
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          user_id: string
          variaveis?: Json
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
          variaveis?: Json
        }
        Relationships: []
      }
      contracts: {
        Row: {
          assinado_em: string | null
          cliente_id: string | null
          conteudo: string | null
          created_at: string
          email_enviado_em: string | null
          id: string
          status: string
          template_id: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assinado_em?: string | null
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
          email_enviado_em?: string | null
          id?: string
          status?: string
          template_id?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assinado_em?: string | null
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
          email_enviado_em?: string | null
          id?: string
          status?: string
          template_id?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
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
          chave_acesso: string | null
          cliente_id: string
          created_at: string
          data_emissao: string
          data_saida: string | null
          id: string
          numero: string
          numero_nfe: string | null
          orcamento_id: string
          os_id: string | null
          pdf_url: string | null
          protocolo_autorizacao: string | null
          serie_nfe: number | null
          status: string
          updated_at: string
          user_id: string | null
          valor_desconto: number | null
          valor_impostos: number | null
          valor_subtotal: number | null
          valor_total: number
          xml_nfe: string | null
          xml_url: string | null
        }
        Insert: {
          chave_acesso?: string | null
          cliente_id: string
          created_at?: string
          data_emissao: string
          data_saida?: string | null
          id?: string
          numero: string
          numero_nfe?: string | null
          orcamento_id: string
          os_id?: string | null
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie_nfe?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_desconto?: number | null
          valor_impostos?: number | null
          valor_subtotal?: number | null
          valor_total: number
          xml_nfe?: string | null
          xml_url?: string | null
        }
        Update: {
          chave_acesso?: string | null
          cliente_id?: string
          created_at?: string
          data_emissao?: string
          data_saida?: string | null
          id?: string
          numero?: string
          numero_nfe?: string | null
          orcamento_id?: string
          os_id?: string | null
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie_nfe?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_desconto?: number | null
          valor_impostos?: number | null
          valor_subtotal?: number | null
          valor_total?: number
          xml_nfe?: string | null
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
          {
            foreignKeyName: "notas_fiscais_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
      orcamento_approval_links: {
        Row: {
          approved_at: string | null
          created_at: string
          expires_at: string
          id: string
          orcamento_id: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          token: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          orcamento_id: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          token: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          orcamento_id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_approval_links_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
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
          peca_id: string | null
          preco_unitario: number
          quantidade: number
          servico_id: string | null
          subtotal: number
          tipo: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          peca_id?: string | null
          preco_unitario?: number
          quantidade?: number
          servico_id?: string | null
          subtotal?: number
          tipo?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          peca_id?: string | null
          preco_unitario?: number
          quantidade?: number
          servico_id?: string | null
          subtotal?: number
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_sequences: {
        Row: {
          created_at: string
          id: string
          next_number: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      orcamento_status_history: {
        Row: {
          alterado_por: string | null
          data_alteracao: string
          id: string
          motivo: string | null
          orcamento_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_por?: string | null
          data_alteracao?: string
          id?: string
          motivo?: string | null
          orcamento_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_por?: string | null
          data_alteracao?: string
          id?: string
          motivo?: string | null
          orcamento_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_status_history_orcamento_id_fkey"
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
          approval_status: string | null
          approval_token: string | null
          approved_at: string | null
          cliente_id: string
          created_at: string
          data_aprovacao: string | null
          data_criacao: string
          data_rejeicao: string | null
          data_vencimento: string | null
          data_visualizacao: string | null
          desconto: number | null
          id: string
          impostos: number | null
          motivo_rejeicao: string | null
          notas: string | null
          numero: string
          numero_formatado: string | null
          rejected_at: string | null
          status: string
          status_enum: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_enviado?: boolean
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          cliente_id: string
          created_at?: string
          data_aprovacao?: string | null
          data_criacao?: string
          data_rejeicao?: string | null
          data_vencimento?: string | null
          data_visualizacao?: string | null
          desconto?: number | null
          id?: string
          impostos?: number | null
          motivo_rejeicao?: string | null
          notas?: string | null
          numero: string
          numero_formatado?: string | null
          rejected_at?: string | null
          status?: string
          status_enum?: string | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alerta_enviado?: boolean
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          cliente_id?: string
          created_at?: string
          data_aprovacao?: string | null
          data_criacao?: string
          data_rejeicao?: string | null
          data_vencimento?: string | null
          data_visualizacao?: string | null
          desconto?: number | null
          id?: string
          impostos?: number | null
          motivo_rejeicao?: string | null
          notas?: string | null
          numero?: string
          numero_formatado?: string | null
          rejected_at?: string | null
          status?: string
          status_enum?: string | null
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
      ordens_servico: {
        Row: {
          anotacoes: string | null
          cliente_id: string
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          numero_formatado: string | null
          orcamento_id: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          cliente_id: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          numero_formatado?: string | null
          orcamento_id?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacoes?: string | null
          cliente_id?: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          numero_formatado?: string | null
          orcamento_id?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_itens: {
        Row: {
          created_at: string
          id: string
          os_id: string
          peca_id: string | null
          preco_unitario: number | null
          quantidade: number | null
          servico_id: string | null
          subtotal: number | null
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          os_id: string
          peca_id?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          servico_id?: string | null
          subtotal?: number | null
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          os_id?: string
          peca_id?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          servico_id?: string | null
          subtotal?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_itens_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
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
          status: string
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
          status?: string
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
          status?: string
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
      pecas: {
        Row: {
          ativo: boolean
          categoria: string
          codigo: string
          created_at: string
          descricao: string
          estoque: number
          fabricante: string | null
          id: string
          updated_at: string
          user_id: string
          valor_custo: number
          valor_venda: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          codigo: string
          created_at?: string
          descricao: string
          estoque?: number
          fabricante?: string | null
          id?: string
          updated_at?: string
          user_id: string
          valor_custo?: number
          valor_venda?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo?: string
          created_at?: string
          descricao?: string
          estoque?: number
          fabricante?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valor_custo?: number
          valor_venda?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      role_default_permissions: {
        Row: {
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          permissions?: Json
          role: string
          updated_at?: string
        }
        Update: {
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          unidade: string
          updated_at: string
          user_id: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          unidade?: string
          updated_at?: string
          user_id: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_padrao?: number
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
          permissions: Json | null
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
          permissions?: Json | null
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
          permissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          requested_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
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
      approve_orcamento_by_token: { Args: { _token: string }; Returns: boolean }
      gerar_approval_token: { Args: never; Returns: string }
      get_approval_link_by_token: {
        Args: { _token: string }
        Returns: {
          approved_at: string
          created_at: string
          expires_at: string
          id: string
          orcamento_id: string
          rejected_at: string
          rejection_reason: string
          status: string
          token: string
        }[]
      }
      get_orcamento_by_approval_token: {
        Args: { _token: string }
        Returns: {
          approval_status: string
          approved_at: string
          cliente_id: string
          cliente_nome: string
          created_at: string
          data_aprovacao: string
          data_criacao: string
          data_rejeicao: string
          data_vencimento: string
          data_visualizacao: string
          desconto: number
          id: string
          impostos: number
          motivo_rejeicao: string
          notas: string
          numero: string
          numero_formatado: string
          rejected_at: string
          status: string
          status_enum: string
          total: number
          updated_at: string
        }[]
      }
      get_orcamento_itens_by_approval_token: {
        Args: { _token: string }
        Returns: {
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          peca_id: string | null
          preco_unitario: number
          quantidade: number
          servico_id: string | null
          subtotal: number
          tipo: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orcamento_itens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_orcamento_by_token: {
        Args: { _motivo: string; _token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "gestor"
        | "administrativo"
        | "tecnico"
        | "operador"
        | "cliente"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "gestor",
        "administrativo",
        "tecnico",
        "operador",
        "cliente",
      ],
    },
  },
} as const
