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
      analytics_events: {
        Row: {
          amount: number | null
          created_at: string
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      approval_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      claim_assignments: {
        Row: {
          assigned_by: string | null
          claim_id: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          sla_deadline: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          claim_id: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          sla_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          claim_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          sla_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_assignments_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "service_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_eligibility_checks: {
        Row: {
          checked_at: string
          checked_by: string | null
          claim_details_complete: boolean
          claim_id: string
          coverage_includes_issue: boolean
          created_at: string
          details: Json
          device_approved: boolean
          id: string
          not_duplicate: boolean
          recommendation: string
          risk_level: string
          risk_score: number
          subscription_active: boolean
        }
        Insert: {
          checked_at?: string
          checked_by?: string | null
          claim_details_complete?: boolean
          claim_id: string
          coverage_includes_issue?: boolean
          created_at?: string
          details?: Json
          device_approved?: boolean
          id?: string
          not_duplicate?: boolean
          recommendation?: string
          risk_level?: string
          risk_score?: number
          subscription_active?: boolean
        }
        Update: {
          checked_at?: string
          checked_by?: string | null
          claim_details_complete?: boolean
          claim_id?: string
          coverage_includes_issue?: boolean
          created_at?: string
          details?: Json
          device_approved?: boolean
          id?: string
          not_duplicate?: boolean
          recommendation?: string
          risk_level?: string
          risk_score?: number
          subscription_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "claim_eligibility_checks_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "service_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_feedback: {
        Row: {
          claim_id: string
          created_at: string
          feedback_text: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_feedback_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "service_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_status_updates: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_by: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status: string
          updated_by?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_status_updates_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "service_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_devices: {
        Row: {
          address: string
          approved_at: string | null
          approved_by: string | null
          auto_renew: boolean
          created_at: string
          gadget_category_id: string | null
          google_location_pin: string | null
          id: string
          imei_number: string | null
          payment_method: string | null
          payment_status: string
          product_name: string
          referred_by_partner_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          serial_number: string
          status: string
          subscription_end: string | null
          subscription_plan_id: string | null
          subscription_start: string | null
          updated_at: string
          upi_transaction_id: string | null
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          address: string
          approved_at?: string | null
          approved_by?: string | null
          auto_renew?: boolean
          created_at?: string
          gadget_category_id?: string | null
          google_location_pin?: string | null
          id?: string
          imei_number?: string | null
          payment_method?: string | null
          payment_status?: string
          product_name: string
          referred_by_partner_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          serial_number: string
          status?: string
          subscription_end?: string | null
          subscription_plan_id?: string | null
          subscription_start?: string | null
          updated_at?: string
          upi_transaction_id?: string | null
          user_id: string
          whatsapp_number: string
        }
        Update: {
          address?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_renew?: boolean
          created_at?: string
          gadget_category_id?: string | null
          google_location_pin?: string | null
          id?: string
          imei_number?: string | null
          payment_method?: string | null
          payment_status?: string
          product_name?: string
          referred_by_partner_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          serial_number?: string
          status?: string
          subscription_end?: string | null
          subscription_plan_id?: string | null
          subscription_start?: string | null
          updated_at?: string
          upi_transaction_id?: string | null
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_devices_gadget_category_id_fkey"
            columns: ["gadget_category_id"]
            isOneToOne: false
            referencedRelation: "gadget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_devices_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_devices_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      device_approval_checks: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          checklist_item_id: string
          created_at: string
          device_id: string
          id: string
          is_checked: boolean
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_item_id: string
          created_at?: string
          device_id: string
          id?: string
          is_checked?: boolean
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_item_id?: string
          created_at?: string
          device_id?: string
          id?: string
          is_checked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "device_approval_checks_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "approval_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_approval_checks_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_approval_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          device_id: string
          id: string
          notes: string | null
          reason: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          device_id: string
          id?: string
          notes?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          device_id?: string
          id?: string
          notes?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_approval_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_info_requests: {
        Row: {
          created_at: string
          customer_response: string | null
          deadline: string | null
          device_id: string
          id: string
          info_needed: string[]
          message: string | null
          requested_by: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          customer_response?: string | null
          deadline?: string | null
          device_id: string
          id?: string
          info_needed?: string[]
          message?: string | null
          requested_by?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          customer_response?: string | null
          deadline?: string | null
          device_id?: string
          id?: string
          info_needed?: string[]
          message?: string | null
          requested_by?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_info_requests_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_permissions: {
        Row: {
          created_at: string
          feature_key: string
          feature_label: string
          id: string
          is_enabled: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          feature_key: string
          feature_label: string
          id?: string
          is_enabled?: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          feature_key?: string
          feature_label?: string
          id?: string
          is_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      finance_compliance_info: {
        Row: {
          created_at: string
          display_order: number
          id: string
          info_group: string
          info_key: string
          info_label: string
          info_value: string
          is_editable: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          info_group?: string
          info_key: string
          info_label: string
          info_value?: string
          is_editable?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          info_group?: string
          info_key?: string
          info_label?: string
          info_value?: string
          is_editable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      finance_gst_returns: {
        Row: {
          created_at: string
          filed_at: string | null
          id: string
          input_tax_credit: number
          net_tax_liability: number
          notes: string | null
          return_period: string
          return_type: string
          status: string
          total_cess: number
          total_cgst: number
          total_igst: number
          total_sgst: number
          total_taxable_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          filed_at?: string | null
          id?: string
          input_tax_credit?: number
          net_tax_liability?: number
          notes?: string | null
          return_period: string
          return_type?: string
          status?: string
          total_cess?: number
          total_cgst?: number
          total_igst?: number
          total_sgst?: number
          total_taxable_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          filed_at?: string | null
          id?: string
          input_tax_credit?: number
          net_tax_liability?: number
          notes?: string | null
          return_period?: string
          return_type?: string
          status?: string
          total_cess?: number
          total_cgst?: number
          total_igst?: number
          total_sgst?: number
          total_taxable_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      finance_partner_payouts: {
        Row: {
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          notes: string | null
          paid_at: string | null
          partner_id: string
          payment_method: string | null
          payment_reference: string | null
          payout_month: string
          status: string
          tds_amount: number
          tds_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payout_month: string
          status?: string
          tds_amount?: number
          tds_rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payout_month?: string
          status?: string
          tds_amount?: number
          tds_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          gst_rate: number
          hsn_sac_code: string | null
          id: string
          is_auto_generated: boolean
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          source_id: string | null
          source_type: string | null
          tax_amount: number
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          gst_rate?: number
          hsn_sac_code?: string | null
          id?: string
          is_auto_generated?: boolean
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          source_id?: string | null
          source_type?: string | null
          tax_amount?: number
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          gst_rate?: number
          hsn_sac_code?: string | null
          id?: string
          is_auto_generated?: boolean
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          source_id?: string | null
          source_type?: string | null
          tax_amount?: number
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gadget_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          subscription_plan_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          subscription_plan_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          subscription_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          cgst_amount: number
          cgst_percent: number
          created_at: string
          customer_device_id: string | null
          customer_email: string | null
          customer_name: string
          due_date: string | null
          id: string
          invoice_number: string
          line_item_description: string
          notes: string | null
          paid_at: string | null
          sgst_amount: number
          sgst_percent: number
          status: string
          subscription_plan_id: string | null
          subtotal: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          cgst_amount?: number
          cgst_percent?: number
          created_at?: string
          customer_device_id?: string | null
          customer_email?: string | null
          customer_name: string
          due_date?: string | null
          id?: string
          invoice_number: string
          line_item_description?: string
          notes?: string | null
          paid_at?: string | null
          sgst_amount?: number
          sgst_percent?: number
          status?: string
          subscription_plan_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          cgst_amount?: number
          cgst_percent?: number
          created_at?: string
          customer_device_id?: string | null
          customer_email?: string | null
          customer_name?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_item_description?: string
          notes?: string | null
          paid_at?: string | null
          sgst_amount?: number
          sgst_percent?: number
          status?: string
          subscription_plan_id?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_device_id_fkey"
            columns: ["customer_device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_sections: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_enabled: boolean
          section_key: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          section_key: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          section_key?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          city: string
          commission_rate: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          partner_type: string
          phone: string | null
          quality_rating: number
          region_id: string | null
          sla_turnaround_days: number
          state: string
          total_repairs: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          partner_type?: string
          phone?: string | null
          quality_rating?: number
          region_id?: string | null
          sla_turnaround_days?: number
          state: string
          total_repairs?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          partner_type?: string
          phone?: string | null
          quality_rating?: number
          region_id?: string | null
          sla_turnaround_days?: number
          state?: string
          total_repairs?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          purchase_order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          purchase_order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          purchase_order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          description: string | null
          expected_delivery: string | null
          id: string
          order_date: string
          po_number: string
          received_at: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expected_delivery?: string | null
          id?: string
          order_date?: string
          po_number: string
          received_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expected_delivery?: string | null
          id?: string
          order_date?: string
          po_number?: string
          received_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_claims: {
        Row: {
          admin_notes: string | null
          assigned_partner_id: string | null
          created_at: string
          description: string
          device_id: string | null
          id: string
          image_urls: string[] | null
          imei_number: string
          issue_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_partner_id?: string | null
          created_at?: string
          description: string
          device_id?: string | null
          id?: string
          image_urls?: string[] | null
          imei_number: string
          issue_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_partner_id?: string | null
          created_at?: string
          description?: string
          device_id?: string | null
          id?: string
          image_urls?: string[] | null
          imei_number?: string
          issue_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_claims_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_claims_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          description: string
          id: string
          image_urls: string[] | null
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          description: string
          id?: string
          image_urls?: string[] | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[] | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          amount_paid: number
          created_at: string
          device_id: string
          id: string
          new_end_date: string
          new_plan_id: string
          old_end_date: string | null
          old_plan_id: string | null
          payment_method: string | null
          renewal_type: string
          upi_transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          device_id: string
          id?: string
          new_end_date: string
          new_plan_id: string
          old_end_date?: string | null
          old_plan_id?: string | null
          payment_method?: string | null
          renewal_type?: string
          upi_transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          device_id?: string
          id?: string
          new_end_date?: string
          new_plan_id?: string
          old_end_date?: string | null
          old_plan_id?: string | null
          payment_method?: string | null
          renewal_type?: string
          upi_transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number
          code: string
          covers_accidental_damage: boolean
          covers_battery: boolean
          covers_hardware_failure: boolean
          covers_liquid_damage: boolean
          covers_motherboard: boolean
          created_at: string
          gadget_category_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          annual_price?: number
          code: string
          covers_accidental_damage?: boolean
          covers_battery?: boolean
          covers_hardware_failure?: boolean
          covers_liquid_damage?: boolean
          covers_motherboard?: boolean
          created_at?: string
          gadget_category_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          annual_price?: number
          code?: string
          covers_accidental_damage?: boolean
          covers_battery?: boolean
          covers_hardware_failure?: boolean
          covers_liquid_damage?: boolean
          covers_motherboard?: boolean
          created_at?: string
          gadget_category_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_gadget_category_id_fkey"
            columns: ["gadget_category_id"]
            isOneToOne: false
            referencedRelation: "gadget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_renewal_reminders: {
        Row: {
          created_at: string
          device_id: string
          id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_renewal_reminders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "customer"
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
      app_role: ["admin", "partner", "customer"],
    },
  },
} as const
