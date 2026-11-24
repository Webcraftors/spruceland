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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          application_code: string
          application_name: string
          application_type: string
          created_at: string
          description: string | null
          id: string
          status: string
        }
        Insert: {
          application_code: string
          application_name: string
          application_type: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
        }
        Update: {
          application_code?: string
          application_name?: string
          application_type?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      breakdown_email_drafts: {
        Row: {
          body: string
          breakdown_id: string
          cc_recipients: string[]
          created_at: string
          id: string
          organization_id: string
          prepared_for: string
          status: string
          subject: string
          to_recipients: string[]
        }
        Insert: {
          body: string
          breakdown_id: string
          cc_recipients?: string[]
          created_at?: string
          id?: string
          organization_id: string
          prepared_for: string
          status?: string
          subject: string
          to_recipients?: string[]
        }
        Update: {
          body?: string
          breakdown_id?: string
          cc_recipients?: string[]
          created_at?: string
          id?: string
          organization_id?: string
          prepared_for?: string
          status?: string
          subject?: string
          to_recipients?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "breakdown_email_drafts_breakdown_id_fkey"
            columns: ["breakdown_id"]
            isOneToOne: true
            referencedRelation: "breakdowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakdown_email_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      breakdowns: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          channel: string
          client_request_key: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          equipment_id: string | null
          escalated_at: string | null
          escalation_reason: string | null
          fault_category: string | null
          fault_description: string
          id: string
          location_id: string | null
          organization_id: string
          priority: string
          reference: string
          reported_at: string
          reported_by: string
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel?: string
          client_request_key?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          equipment_id?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          fault_category?: string | null
          fault_description: string
          id?: string
          location_id?: string | null
          organization_id: string
          priority?: string
          reference?: string
          reported_at?: string
          reported_by: string
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          channel?: string
          client_request_key?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          equipment_id?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          fault_category?: string | null
          fault_description?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          priority?: string
          reference?: string
          reported_at?: string
          reported_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakdowns_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakdowns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breakdowns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_branding: {
        Row: {
          address: string | null
          email: string | null
          legal_name: string
          logo_public_url: string | null
          logo_storage_path: string | null
          organization_id: string
          phone: string | null
          registration_number: string | null
          tax_number: string | null
          trading_name: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          legal_name: string
          logo_public_url?: string | null
          logo_storage_path?: string | null
          organization_id: string
          phone?: string | null
          registration_number?: string | null
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          legal_name?: string
          logo_public_url?: string | null
          logo_storage_path?: string | null
          organization_id?: string
          phone?: string | null
          registration_number?: string | null
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_definitions: {
        Row: {
          created_at: string
          default_value: Json
          description: string | null
          display_name: string
          id: string
          module: string
          organization_editable: boolean
          setting_key: string
          status: string
          updated_at: string
          validation_rules: Json
          value_type: string
        }
        Insert: {
          created_at?: string
          default_value: Json
          description?: string | null
          display_name: string
          id?: string
          module: string
          organization_editable?: boolean
          setting_key: string
          status?: string
          updated_at?: string
          validation_rules?: Json
          value_type: string
        }
        Update: {
          created_at?: string
          default_value?: Json
          description?: string | null
          display_name?: string
          id?: string
          module?: string
          organization_editable?: boolean
          setting_key?: string
          status?: string
          updated_at?: string
          validation_rules?: Json
          value_type?: string
        }
        Relationships: []
      }
      configuration_suggestions: {
        Row: {
          category_code: string
          country_code: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          industry_code: string | null
          sort_order: number
          status: string
          suggestion_code: string
          updated_at: string
        }
        Insert: {
          category_code: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          industry_code?: string | null
          sort_order?: number
          status?: string
          suggestion_code: string
          updated_at?: string
        }
        Update: {
          category_code?: string
          country_code?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          industry_code?: string | null
          sort_order?: number
          status?: string
          suggestion_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuration_suggestions_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "suggestion_categories"
            referencedColumns: ["category_code"]
          },
        ]
      }
      department_members: {
        Row: {
          created_at: string
          department_id: string
          id: string
          member_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          member_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          member_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "department_members_member_id_organization_id_fkey"
            columns: ["member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          parent_department_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parent_department_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_department_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_same_org_fkey"
            columns: ["parent_department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      equipment: {
        Row: {
          asset_tag: string | null
          condition_code: string | null
          created_at: string
          created_by: string
          description: string | null
          equipment_name: string
          equipment_type_id: string
          id: string
          installed_on: string | null
          lifecycle_status: string
          location_id: string | null
          manufacturer_name: string | null
          model_id: string | null
          model_name: string | null
          notes: string | null
          organization_id: string
          record_version: number
          serial_number: string | null
          supplied_on: string | null
          supplier_name: string | null
          supplier_organization_id: string | null
          updated_at: string
          updated_by: string
          warranty_end_on: string | null
          warranty_start_on: string | null
        }
        Insert: {
          asset_tag?: string | null
          condition_code?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          equipment_name: string
          equipment_type_id: string
          id?: string
          installed_on?: string | null
          lifecycle_status?: string
          location_id?: string | null
          manufacturer_name?: string | null
          model_id?: string | null
          model_name?: string | null
          notes?: string | null
          organization_id: string
          record_version?: number
          serial_number?: string | null
          supplied_on?: string | null
          supplier_name?: string | null
          supplier_organization_id?: string | null
          updated_at?: string
          updated_by: string
          warranty_end_on?: string | null
          warranty_start_on?: string | null
        }
        Update: {
          asset_tag?: string | null
          condition_code?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          equipment_name?: string
          equipment_type_id?: string
          id?: string
          installed_on?: string | null
          lifecycle_status?: string
          location_id?: string | null
          manufacturer_name?: string | null
          model_id?: string | null
          model_name?: string | null
          notes?: string | null
          organization_id?: string
          record_version?: number
          serial_number?: string | null
          supplied_on?: string | null
          supplier_name?: string | null
          supplier_organization_id?: string | null
          updated_at?: string
          updated_by?: string
          warranty_end_on?: string | null
          warranty_start_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_equipment_type_id_organization_id_fkey"
            columns: ["equipment_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_location_id_organization_id_fkey"
            columns: ["location_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_model_id_organization_id_equipment_type_id_fkey"
            columns: ["model_id", "organization_id", "equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_models"
            referencedColumns: ["id", "organization_id", "equipment_type_id"]
          },
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_registered_condition_fkey"
            columns: ["organization_id", "condition_code"]
            isOneToOne: false
            referencedRelation: "equipment_conditions"
            referencedColumns: ["organization_id", "condition_code"]
          },
          {
            foreignKeyName: "equipment_supplier_organization_id_fkey"
            columns: ["supplier_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          category_code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category_code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category_code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_change_requests: {
        Row: {
          actor_organization_id: string | null
          created_at: string
          equipment_id: string
          execution_result: Json | null
          expected_record_version: number
          id: string
          organization_id: string
          reason: string
          request_payload: Json
          request_type: string
          requested_by: string
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actor_organization_id?: string | null
          created_at?: string
          equipment_id: string
          execution_result?: Json | null
          expected_record_version: number
          id?: string
          organization_id: string
          reason: string
          request_payload: Json
          request_type: string
          requested_by: string
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actor_organization_id?: string | null
          created_at?: string
          equipment_id?: string
          execution_result?: Json | null
          expected_record_version?: number
          id?: string
          organization_id?: string
          reason?: string
          request_payload?: Json
          request_type?: string
          requested_by?: string
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_change_request_owner_fk"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_change_requests_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_change_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_conditions: {
        Row: {
          condition_code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          condition_code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          condition_code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_conditions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_documents: {
        Row: {
          archived_at: string | null
          created_at: string
          document_type: string
          equipment_id: string
          file_name: string
          id: string
          mime_type: string | null
          organization_id: string
          status: string
          storage_path: string
          uploaded_by: string
          verification_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          document_type: string
          equipment_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          organization_id: string
          status?: string
          storage_path: string
          uploaded_by: string
          verification_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          document_type?: string
          equipment_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          status?: string
          storage_path?: string
          uploaded_by?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "equipment_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance_occurrences: {
        Row: {
          created_at: string
          due_on: string
          equipment_id: string
          id: string
          maintenance_plan_id: string
          maintenance_type_id: string
          organization_id: string
          record_version: number
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          sequence_number: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_on: string
          equipment_id: string
          id?: string
          maintenance_plan_id: string
          maintenance_type_id: string
          organization_id: string
          record_version?: number
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sequence_number: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_on?: string
          equipment_id?: string
          id?: string
          maintenance_plan_id?: string
          maintenance_type_id?: string
          organization_id?: string
          record_version?: number
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sequence_number?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_occurrences_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_occurrence_plan_fk"
            columns: [
              "maintenance_plan_id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
            isOneToOne: false
            referencedRelation: "equipment_maintenance_plans"
            referencedColumns: [
              "id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
          },
        ]
      }
      equipment_maintenance_plans: {
        Row: {
          created_at: string
          created_by: string
          equipment_id: string
          first_due_on: string
          id: string
          instructions: string | null
          interval_unit: string | null
          interval_value: number | null
          maintenance_type_id: string
          organization_id: string
          plan_name: string
          record_version: number
          recurrence_type: string
          reminder_days: number
          scheduling_basis: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          equipment_id: string
          first_due_on: string
          id?: string
          instructions?: string | null
          interval_unit?: string | null
          interval_value?: number | null
          maintenance_type_id: string
          organization_id: string
          plan_name: string
          record_version?: number
          recurrence_type: string
          reminder_days?: number
          scheduling_basis?: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          equipment_id?: string
          first_due_on?: string
          id?: string
          instructions?: string | null
          interval_unit?: string | null
          interval_value?: number | null
          maintenance_type_id?: string
          organization_id?: string
          plan_name?: string
          record_version?: number
          recurrence_type?: string
          reminder_days?: number
          scheduling_basis?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_plan_equipment_fk"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "maintenance_plan_type_fk"
            columns: ["maintenance_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_maintenance_types"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      equipment_maintenance_types: {
        Row: {
          created_at: string
          created_by: string
          default_interval_unit: string | null
          default_interval_value: number | null
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          type_code: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_interval_unit?: string | null
          default_interval_value?: number | null
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          type_code: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_interval_unit?: string | null
          default_interval_value?: number | null
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          type_code?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_manufacturers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manufacturer_name: string
          organization_id: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manufacturer_name: string
          organization_id: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manufacturer_name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_manufacturers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_models: {
        Row: {
          created_at: string
          default_specifications: Json
          description: string | null
          equipment_type_id: string
          id: string
          manufacturer_id: string
          model_name: string
          model_number: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_specifications?: Json
          description?: string | null
          equipment_type_id: string
          id?: string
          manufacturer_id: string
          model_name: string
          model_number?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_specifications?: Json
          description?: string | null
          equipment_type_id?: string
          id?: string
          manufacturer_id?: string
          model_name?: string
          model_number?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_models_equipment_type_id_organization_id_fkey"
            columns: ["equipment_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_models_manufacturer_id_organization_id_fkey"
            columns: ["manufacturer_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_manufacturers"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_models_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_notification_events: {
        Row: {
          audit_log_id: string
          channel: string
          created_at: string
          equipment_id: string
          event_type: string
          id: string
          organization_id: string
        }
        Insert: {
          audit_log_id: string
          channel?: string
          created_at?: string
          equipment_id: string
          event_type: string
          id?: string
          organization_id: string
        }
        Update: {
          audit_log_id?: string
          channel?: string
          created_at?: string
          equipment_id?: string
          event_type?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_notification_events_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: true
            referencedRelation: "audit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_notification_owner_fk"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      equipment_relationship_locations: {
        Row: {
          created_at: string
          location_id: string
          relationship_id: string
        }
        Insert: {
          created_at?: string
          location_id: string
          relationship_id: string
        }
        Update: {
          created_at?: string
          location_id?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_relationship_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_relationship_locations_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "equipment_service_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_replacements: {
        Row: {
          actor_organization_id: string | null
          created_at: string
          id: string
          organization_id: string
          original_equipment_id: string
          reason: string
          replaced_by: string
          replacement_equipment_id: string
        }
        Insert: {
          actor_organization_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          original_equipment_id: string
          reason: string
          replaced_by: string
          replacement_equipment_id: string
        }
        Update: {
          actor_organization_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          original_equipment_id?: string
          reason?: string
          replaced_by?: string
          replacement_equipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_replacement_new_fk"
            columns: ["replacement_equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_replacement_original_fk"
            columns: ["original_equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_replacements_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_replacements_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_service_records: {
        Row: {
          actor_organization_id: string | null
          created_at: string
          equipment_id: string
          equipment_snapshot: Json
          findings: string | null
          follow_up_required: boolean
          id: string
          maintenance_occurrence_id: string | null
          maintenance_type_id: string
          organization_id: string
          performed_by_name: string | null
          recommendations: string | null
          recommended_follow_up_on: string | null
          recorded_by: string
          service_date: string
          service_outcome: string
          service_reference: string | null
          supersedes_service_record_id: string | null
          work_performed: string
        }
        Insert: {
          actor_organization_id?: string | null
          created_at?: string
          equipment_id: string
          equipment_snapshot: Json
          findings?: string | null
          follow_up_required?: boolean
          id?: string
          maintenance_occurrence_id?: string | null
          maintenance_type_id: string
          organization_id: string
          performed_by_name?: string | null
          recommendations?: string | null
          recommended_follow_up_on?: string | null
          recorded_by: string
          service_date: string
          service_outcome: string
          service_reference?: string | null
          supersedes_service_record_id?: string | null
          work_performed: string
        }
        Update: {
          actor_organization_id?: string | null
          created_at?: string
          equipment_id?: string
          equipment_snapshot?: Json
          findings?: string | null
          follow_up_required?: boolean
          id?: string
          maintenance_occurrence_id?: string | null
          maintenance_type_id?: string
          organization_id?: string
          performed_by_name?: string | null
          recommendations?: string | null
          recommended_follow_up_on?: string | null
          recorded_by?: string
          service_date?: string
          service_outcome?: string
          service_reference?: string | null
          supersedes_service_record_id?: string | null
          work_performed?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_service_records_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_record_equipment_fk"
            columns: ["equipment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "service_record_occurrence_fk"
            columns: [
              "maintenance_occurrence_id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
            isOneToOne: false
            referencedRelation: "equipment_maintenance_occurrences"
            referencedColumns: [
              "id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
          },
          {
            foreignKeyName: "service_record_supersedes_fk"
            columns: [
              "supersedes_service_record_id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
            isOneToOne: false
            referencedRelation: "equipment_service_records"
            referencedColumns: [
              "id",
              "organization_id",
              "equipment_id",
              "maintenance_type_id",
            ]
          },
          {
            foreignKeyName: "service_record_type_fk"
            columns: ["maintenance_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_maintenance_types"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      equipment_service_relationships: {
        Row: {
          allow_compliance_records: boolean
          allow_equipment_configuration: boolean
          allow_equipment_decommission: boolean
          allow_equipment_registration: boolean
          allow_equipment_transfer: boolean
          allow_equipment_update: boolean
          allow_equipment_view: boolean
          allow_service_records: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          owner_organization_id: string
          provider_organization_id: string
          relationship_name: string
          scope_type: string
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          allow_compliance_records?: boolean
          allow_equipment_configuration?: boolean
          allow_equipment_decommission?: boolean
          allow_equipment_registration?: boolean
          allow_equipment_transfer?: boolean
          allow_equipment_update?: boolean
          allow_equipment_view?: boolean
          allow_service_records?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          owner_organization_id: string
          provider_organization_id: string
          relationship_name: string
          scope_type?: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          allow_compliance_records?: boolean
          allow_equipment_configuration?: boolean
          allow_equipment_decommission?: boolean
          allow_equipment_registration?: boolean
          allow_equipment_transfer?: boolean
          allow_equipment_update?: boolean
          allow_equipment_view?: boolean
          allow_service_records?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          owner_organization_id?: string
          provider_organization_id?: string
          relationship_name?: string
          scope_type?: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_service_relationships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_relationships_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_relationships_provider_organization_id_fkey"
            columns: ["provider_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_specification_fields: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          equipment_type_id: string
          field_code: string
          id: string
          is_required: boolean
          organization_id: string
          sort_order: number
          status: string
          unit_label: string | null
          updated_at: string
          validation_rules: Json
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          equipment_type_id: string
          field_code: string
          id?: string
          is_required?: boolean
          organization_id: string
          sort_order?: number
          status?: string
          unit_label?: string | null
          updated_at?: string
          validation_rules?: Json
          value_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          equipment_type_id?: string
          field_code?: string
          id?: string
          is_required?: boolean
          organization_id?: string
          sort_order?: number
          status?: string
          unit_label?: string | null
          updated_at?: string
          validation_rules?: Json
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_specification_field_equipment_type_id_organizati_fkey"
            columns: ["equipment_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_specification_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_specification_values: {
        Row: {
          created_at: string
          equipment_id: string
          equipment_type_id: string
          id: string
          organization_id: string
          specification_field_id: string
          specification_value: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          equipment_type_id: string
          id?: string
          organization_id: string
          specification_field_id: string
          specification_value: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          equipment_type_id?: string
          id?: string
          organization_id?: string
          specification_field_id?: string
          specification_value?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_specification_value_equipment_id_organization_id_fkey"
            columns: ["equipment_id", "organization_id", "equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id", "organization_id", "equipment_type_id"]
          },
          {
            foreignKeyName: "equipment_specification_value_specification_field_id_organ_fkey"
            columns: [
              "specification_field_id",
              "organization_id",
              "equipment_type_id",
            ]
            isOneToOne: false
            referencedRelation: "equipment_specification_fields"
            referencedColumns: ["id", "organization_id", "equipment_type_id"]
          },
          {
            foreignKeyName: "equipment_specification_values_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          type_code: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          type_code: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          type_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_types_category_id_organization_id_fkey"
            columns: ["category_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "equipment_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_verifications: {
        Row: {
          actor_organization_id: string | null
          authority: string
          certificate_number: string | null
          created_at: string
          equipment_id: string
          id: string
          notes: string | null
          organization_id: string
          outcome: string
          recorded_by: string
          seal_number: string | null
          supersedes_verification_id: string | null
          valid_until: string
          verified_on: string
        }
        Insert: {
          actor_organization_id?: string | null
          authority?: string
          certificate_number?: string | null
          created_at?: string
          equipment_id: string
          id?: string
          notes?: string | null
          organization_id: string
          outcome: string
          recorded_by: string
          seal_number?: string | null
          supersedes_verification_id?: string | null
          valid_until: string
          verified_on: string
        }
        Update: {
          actor_organization_id?: string | null
          authority?: string
          certificate_number?: string | null
          created_at?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          outcome?: string
          recorded_by?: string
          seal_number?: string | null
          supersedes_verification_id?: string | null
          valid_until?: string
          verified_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_verifications_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_verifications_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_verifications_supersedes_verification_id_fkey"
            columns: ["supersedes_verification_id"]
            isOneToOne: false
            referencedRelation: "equipment_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_applications: {
        Row: {
          application_id: string
          created_at: string
          invitation_id: string
          organization_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          invitation_id: string
          organization_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          invitation_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_applications_invitation_id_organization_id_fkey"
            columns: ["invitation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "invitation_applications_organization_id_application_id_fkey"
            columns: ["organization_id", "application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["organization_id", "application_id"]
          },
        ]
      }
      invitation_departments: {
        Row: {
          created_at: string
          department_id: string
          invitation_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          invitation_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          invitation_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_departments_department_id_organization_id_fkey"
            columns: ["department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "invitation_departments_invitation_id_organization_id_fkey"
            columns: ["invitation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      invitation_locations: {
        Row: {
          created_at: string
          invitation_id: string
          location_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          invitation_id: string
          location_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          invitation_id?: string
          location_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_locations_invitation_id_organization_id_fkey"
            columns: ["invitation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "invitation_locations_location_id_organization_id_fkey"
            columns: ["location_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      invitation_roles: {
        Row: {
          created_at: string
          invitation_id: string
          organization_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          invitation_id: string
          organization_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          invitation_id?: string
          organization_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_roles_invitation_id_organization_id_fkey"
            columns: ["invitation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "invitation_roles_role_id_organization_id_fkey"
            columns: ["role_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      job_cards: {
        Row: {
          client_representative_name: string | null
          correction_reason: string | null
          created_at: string
          created_by: string
          fault_identified: string
          id: string
          job_id: string
          no_signature_reason: string | null
          organization_id: string
          physical_card_reference: string | null
          recommendations: string | null
          reference: string
          repair_outcome: string
          revision: number
          service_date: string
          signature_data: string | null
          signature_method: string
          snapshot: Json
          supersedes_job_card_id: string | null
          technician_id: string
          work_carried_out: string
        }
        Insert: {
          client_representative_name?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by: string
          fault_identified: string
          id?: string
          job_id: string
          no_signature_reason?: string | null
          organization_id: string
          physical_card_reference?: string | null
          recommendations?: string | null
          reference?: string
          repair_outcome: string
          revision?: number
          service_date?: string
          signature_data?: string | null
          signature_method: string
          snapshot: Json
          supersedes_job_card_id?: string | null
          technician_id: string
          work_carried_out: string
        }
        Update: {
          client_representative_name?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by?: string
          fault_identified?: string
          id?: string
          job_id?: string
          no_signature_reason?: string | null
          organization_id?: string
          physical_card_reference?: string | null
          recommendations?: string | null
          reference?: string
          repair_outcome?: string
          revision?: number
          service_date?: string
          signature_data?: string | null
          signature_method?: string
          snapshot?: Json
          supersedes_job_card_id?: string | null
          technician_id?: string
          work_carried_out?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_supersedes_job_card_id_fkey"
            columns: ["supersedes_job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          from_status: string | null
          id: string
          job_id: string
          reason: string | null
          technician_id: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          reason?: string | null
          technician_id?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          reason?: string | null
          technician_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_technician_id: string | null
          breakdown_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          close_reason: string | null
          closed_at: string | null
          completed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          description: string
          en_route_at: string | null
          equipment_id: string | null
          hold_reason: string | null
          id: string
          internal_notes: string | null
          job_type: string
          location_id: string | null
          maintenance_occurrence_id: string | null
          organization_id: string
          parent_job_id: string | null
          priority: string
          reference: string
          repair_outcome: string | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_technician_id?: string | null
          breakdown_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          close_reason?: string | null
          closed_at?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          description: string
          en_route_at?: string | null
          equipment_id?: string | null
          hold_reason?: string | null
          id?: string
          internal_notes?: string | null
          job_type?: string
          location_id?: string | null
          maintenance_occurrence_id?: string | null
          organization_id: string
          parent_job_id?: string | null
          priority?: string
          reference?: string
          repair_outcome?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_technician_id?: string | null
          breakdown_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          close_reason?: string | null
          closed_at?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          description?: string
          en_route_at?: string | null
          equipment_id?: string | null
          hold_reason?: string | null
          id?: string
          internal_notes?: string | null
          job_type?: string
          location_id?: string | null
          maintenance_occurrence_id?: string | null
          organization_id?: string
          parent_job_id?: string | null
          priority?: string
          reference?: string
          repair_outcome?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_breakdown_id_fkey"
            columns: ["breakdown_id"]
            isOneToOne: false
            referencedRelation: "breakdowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_maintenance_occurrence_id_fkey"
            columns: ["maintenance_occurrence_id"]
            isOneToOne: false
            referencedRelation: "equipment_maintenance_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_bootstrap_mappings: {
        Row: {
          application_id: string
          bootstrap_key: string
          created_at: string
          enabled: boolean
          is_platform_level: boolean
          leadership_key: string | null
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          bootstrap_key: string
          created_at?: string
          enabled?: boolean
          is_platform_level?: boolean
          leadership_key?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          bootstrap_key?: string
          created_at?: string
          enabled?: boolean
          is_platform_level?: boolean
          leadership_key?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_bootstrap_mappings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_bootstrap_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_bootstrap_org_app_fkey"
            columns: ["organization_id", "application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["organization_id", "application_id"]
          },
          {
            foreignKeyName: "leadership_bootstrap_role_fkey"
            columns: ["organization_id", "leadership_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "leadership_key"]
          },
        ]
      }
      leadership_provisioning: {
        Row: {
          leadership_type: string
          provisioned_at: string
          user_id: string
        }
        Insert: {
          leadership_type: string
          provisioned_at?: string
          user_id: string
        }
        Update: {
          leadership_type?: string
          provisioned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_provisioning_bootstrap_key_fkey"
            columns: ["leadership_type"]
            isOneToOne: false
            referencedRelation: "leadership_bootstrap_mappings"
            referencedColumns: ["bootstrap_key"]
          },
          {
            foreignKeyName: "leadership_provisioning_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_types: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          type_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          type_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          type_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          location_code: string | null
          location_type: string
          name: string
          organization_id: string
          parent_location_id: string | null
          province: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          location_code?: string | null
          location_type: string
          name: string
          organization_id: string
          parent_location_id?: string | null
          province?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          location_code?: string | null
          location_type?: string
          name?: string
          organization_id?: string
          parent_location_id?: string | null
          province?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_same_org_fkey"
            columns: ["parent_location_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "locations_registered_type_fkey"
            columns: ["organization_id", "location_type"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["organization_id", "type_code"]
          },
        ]
      }
      member_app_access: {
        Row: {
          application_id: string
          granted_at: string
          id: string
          member_id: string
          organization_id: string
        }
        Insert: {
          application_id: string
          granted_at?: string
          id?: string
          member_id: string
          organization_id: string
        }
        Update: {
          application_id?: string
          granted_at?: string
          id?: string
          member_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_app_access_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_app_access_member_id_organization_id_fkey"
            columns: ["member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "member_app_access_org_application_fkey"
            columns: ["organization_id", "application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["organization_id", "application_id"]
          },
        ]
      }
      member_locations: {
        Row: {
          assigned_at: string
          id: string
          location_id: string
          member_id: string
          organization_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          location_id: string
          member_id: string
          organization_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          location_id?: string
          member_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_locations_location_id_organization_id_fkey"
            columns: ["location_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "member_locations_member_id_organization_id_fkey"
            columns: ["member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      member_roles: {
        Row: {
          assigned_at: string
          id: string
          member_id: string
          organization_id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          member_id: string
          organization_id: string
          role_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          member_id?: string
          organization_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_member_id_organization_id_fkey"
            columns: ["member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "member_roles_role_id_organization_id_fkey"
            columns: ["role_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string
          email_recipients: string[]
          event_type: string
          id: string
          organization_id: string
          payload: Json
          processed_at: string | null
          recipient_user_ids: string[]
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          email_recipients?: string[]
          event_type: string
          id?: string
          organization_id: string
          payload: Json
          processed_at?: string | null
          recipient_user_ids?: string[]
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          email_recipients?: string[]
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          processed_at?: string | null
          recipient_user_ids?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          email_enabled: boolean
          email_recipients: string[]
          event_type: string
          id: string
          in_app_enabled: boolean
          organization_id: string
          push_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          email_enabled?: boolean
          email_recipients?: string[]
          event_type: string
          id?: string
          in_app_enabled?: boolean
          organization_id: string
          push_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          email_enabled?: boolean
          email_recipients?: string[]
          event_type?: string
          id?: string
          in_app_enabled?: boolean
          organization_id?: string
          push_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          notification_type: string
          organization_id: string
          read_at: string | null
          recipient_user_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          notification_type: string
          organization_id: string
          read_at?: string | null
          recipient_user_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          notification_type?: string
          organization_id?: string
          read_at?: string | null
          recipient_user_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_applications: {
        Row: {
          application_id: string
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          membership_status: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          membership_status?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          membership_status?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          configuration_id: string
          created_at: string
          id: string
          organization_id: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          configuration_id: string
          created_at?: string
          id?: string
          organization_id: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          configuration_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "configuration_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_type: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_type: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_type?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_delegable: boolean
          module: string
          permission_code: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_delegable?: boolean
          module: string
          permission_code: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_delegable?: boolean
          module?: string
          permission_code?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          status?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          image_urls: string[]
          internal_notes: string | null
          is_active: boolean
          is_published: boolean
          low_stock_threshold: number
          name: string
          quantity_on_hand: number
          quantity_reserved: number
          selling_price: number
          sku: string
          supplier_reference: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          internal_notes?: string | null
          is_active?: boolean
          is_published?: boolean
          low_stock_threshold?: number
          name: string
          quantity_on_hand?: number
          quantity_reserved?: number
          selling_price?: number
          sku: string
          supplier_reference?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          internal_notes?: string | null
          is_active?: boolean
          is_published?: boolean
          low_stock_threshold?: number
          name?: string
          quantity_on_hand?: number
          quantity_reserved?: number
          selling_price?: number
          sku?: string
          supplier_reference?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_context: Json | null
          created_at: string
          email: string | null
          employee_ref: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_context?: Json | null
          created_at?: string
          email?: string | null
          employee_ref?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_context?: Json | null
          created_at?: string
          email?: string | null
          employee_ref?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_protected: boolean
          is_system_role: boolean
          leadership_key: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_protected?: boolean
          is_system_role?: boolean
          leadership_key?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_protected?: boolean
          is_system_role?: boolean
          leadership_key?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          actor_user_id: string
          created_at: string
          id: string
          movement_type: string
          on_hand_after: number
          order_id: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          reserved_after: number
          supplier_reference: string | null
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          id?: string
          movement_type: string
          on_hand_after: number
          order_id?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          reserved_after: number
          supplier_reference?: string | null
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          id?: string
          movement_type?: string
          on_hand_after?: number
          order_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          reserved_after?: number
          supplier_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_lines: {
        Row: {
          currency: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          unit: string
          unit_price: number
        }
        Insert: {
          currency: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          unit: string
          unit_price: number
        }
        Update: {
          currency?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sku?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          cancelled_at: string | null
          client_request_key: string | null
          completed_at: string | null
          confirmed_at: string | null
          currency: string
          delivered_at: string | null
          delivery_instructions: string | null
          delivery_location_id: string | null
          dispatched_at: string | null
          id: string
          invoice_reference: string | null
          organization_id: string
          payment_status: string
          placed_at: string
          placed_by: string
          purchase_order_reference: string | null
          quotation_reference: string | null
          reference: string
          status: string
          status_reason: string | null
          subtotal: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          client_request_key?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          currency: string
          delivered_at?: string | null
          delivery_instructions?: string | null
          delivery_location_id?: string | null
          dispatched_at?: string | null
          id?: string
          invoice_reference?: string | null
          organization_id: string
          payment_status?: string
          placed_at?: string
          placed_by: string
          purchase_order_reference?: string | null
          quotation_reference?: string | null
          reference?: string
          status?: string
          status_reason?: string | null
          subtotal: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          client_request_key?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          currency?: string
          delivered_at?: string | null
          delivery_instructions?: string | null
          delivery_location_id?: string | null
          dispatched_at?: string | null
          id?: string
          invoice_reference?: string | null
          organization_id?: string
          payment_status?: string
          placed_at?: string
          placed_by?: string
          purchase_order_reference?: string | null
          quotation_reference?: string | null
          reference?: string
          status?: string
          status_reason?: string | null
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_categories: {
        Row: {
          category_code: string
          created_at: string
          description: string | null
          display_name: string
          status: string
          updated_at: string
        }
        Insert: {
          category_code: string
          created_at?: string
          description?: string | null
          display_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      technician_availability: {
        Row: {
          note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          employee_ref: string | null
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string
          onboarding_method: string
          organization_id: string
          phone: string | null
          revoked_at: string | null
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          employee_ref?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by: string
          onboarding_method?: string
          organization_id: string
          phone?: string | null
          revoked_at?: string | null
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          employee_ref?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string
          onboarding_method?: string
          organization_id?: string
          phone?: string | null
          revoked_at?: string | null
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_user_invitation: { Args: { p_token: string }; Returns: Json }
      advance_equipment_maintenance_plan: {
        Args: {
          p_completion_date: string
          p_plan_id: string
          p_previous_due_on: string
        }
        Returns: Json
      }
      archive_equipment_document: {
        Args: { p_actor_organization_id: string; p_document_id: string }
        Returns: Json
      }
      assert_eligible_technician: {
        Args: { p_user: string }
        Returns: undefined
      }
      assign_job: {
        Args: {
          p_job_id: string
          p_scheduled_for?: string
          p_technician_id: string
        }
        Returns: Json
      }
      breakdown_derived_status: {
        Args: { p_b: Database["public"]["Tables"]["breakdowns"]["Row"] }
        Returns: string
      }
      build_job_card_snapshot: {
        Args: { p_job: Database["public"]["Tables"]["jobs"]["Row"] }
        Returns: Json
      }
      calculate_equipment_maintenance_due_date: {
        Args: {
          p_base_date: string
          p_interval_unit: string
          p_interval_value: number
        }
        Returns: string
      }
      caller_can_access_equipment: {
        Args: { p_equipment_id: string; p_operation: string }
        Returns: boolean
      }
      caller_can_upload_equipment_document: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      can_access_equipment: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_operation: string
        }
        Returns: boolean
      }
      can_access_equipment_change_request: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_operation: string
        }
        Returns: boolean
      }
      can_access_equipment_scope: {
        Args: {
          p_actor_organization_id: string
          p_location_id: string
          p_operation: string
          p_owner_organization_id: string
        }
        Returns: boolean
      }
      can_create_location: {
        Args: { p_organization_id: string; p_parent_location_id?: string }
        Returns: boolean
      }
      can_delegate_permission: {
        Args: { p_organization_id: string; p_permission_id: string }
        Returns: boolean
      }
      can_manage_all_locations: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_applications: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_configuration: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_departments: {
        Args: { p_operation: string; p_organization_id: string }
        Returns: boolean
      }
      can_manage_equipment_configuration: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_equipment_maintenance: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_equipment_maintenance_plan: {
        Args: { p_actor_organization_id: string; p_equipment_id: string }
        Returns: boolean
      }
      can_manage_equipment_relationships: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_invitations: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_location: {
        Args: { p_location_id: string; p_organization_id: string }
        Returns: boolean
      }
      can_manage_location_types: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_members: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_roles: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_suggestions: { Args: never; Returns: boolean }
      can_manage_target_member: {
        Args: { p_member_id: string; p_organization_id: string }
        Returns: boolean
      }
      can_manage_target_role: {
        Args: { p_organization_id: string; p_role_id: string }
        Returns: boolean
      }
      can_transfer_equipment: {
        Args: {
          p_actor_organization_id: string
          p_destination_location_id: string
          p_equipment_id: string
        }
        Returns: boolean
      }
      can_update_location: {
        Args: { p_location_id: string; p_organization_id: string }
        Returns: boolean
      }
      can_view_client_service_record: {
        Args: { p_loc: string; p_org: string }
        Returns: boolean
      }
      can_view_configuration: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_view_equipment_configuration: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      complete_job: {
        Args: {
          p_client_representative_name?: string
          p_fault_identified: string
          p_job_id: string
          p_no_signature_reason?: string
          p_physical_card_reference?: string
          p_recommendations?: string
          p_repair_outcome: string
          p_signature_data?: string
          p_signature_method: string
          p_work_carried_out: string
        }
        Returns: Json
      }
      correct_equipment_service_record: {
        Args: {
          p_actor_organization_id: string
          p_changes: Json
          p_reason: string
          p_service_record_id: string
        }
        Returns: Json
      }
      correct_job_card: {
        Args: {
          p_correction_reason: string
          p_fault_identified?: string
          p_job_card_id: string
          p_physical_card_reference?: string
          p_recommendations?: string
          p_repair_outcome?: string
          p_work_carried_out?: string
        }
        Returns: Json
      }
      create_client_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: Json
      }
      create_custom_role: {
        Args: {
          p_description?: string
          p_name: string
          p_organization_id: string
        }
        Returns: Json
      }
      create_department: {
        Args: {
          p_description?: string
          p_name: string
          p_organization_id: string
          p_parent_department_id?: string
        }
        Returns: Json
      }
      create_equipment_maintenance_plan: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_first_due_on: string
          p_instructions: string
          p_interval_unit: string
          p_interval_value: number
          p_maintenance_type_id: string
          p_plan_name: string
          p_recurrence_type: string
          p_reminder_days?: number
          p_scheduling_basis: string
        }
        Returns: Json
      }
      create_job: {
        Args: {
          p_breakdown_id?: string
          p_description: string
          p_equipment_id?: string
          p_internal_notes?: string
          p_job_type?: string
          p_location_id?: string
          p_maintenance_occurrence_id?: string
          p_organization_id: string
          p_priority?: string
          p_scheduled_for?: string
          p_technician_id?: string
        }
        Returns: Json
      }
      create_location: {
        Args: {
          p_address?: string
          p_city?: string
          p_country?: string
          p_location_code?: string
          p_location_type: string
          p_name: string
          p_organization_id: string
          p_parent_location_id?: string
          p_province?: string
        }
        Returns: Json
      }
      create_user_invitation: {
        Args: {
          p_application_ids?: string[]
          p_department_ids?: string[]
          p_email: string
          p_employee_ref?: string
          p_full_name?: string
          p_location_ids?: string[]
          p_onboarding_method?: string
          p_organization_id: string
          p_phone?: string
          p_role_ids: string[]
          p_token_hash: string
        }
        Returns: string
      }
      current_internal_role: { Args: never; Returns: string }
      delete_custom_role: {
        Args: { p_organization_id: string; p_reason: string; p_role_id: string }
        Returns: Json
      }
      equipment_operation_permission: {
        Args: { p_operation: string }
        Returns: string
      }
      equipment_specification_snapshot: {
        Args: { p_equipment_id: string }
        Returns: Json
      }
      expire_user_invitations: {
        Args: { p_organization_id: string }
        Returns: number
      }
      get_assignable_member_roles: {
        Args: { p_organization_id: string }
        Returns: {
          description: string
          permission_count: number
          role_id: string
          role_name: string
        }[]
      }
      get_breakdown_email_draft: {
        Args: { p_breakdown_id: string }
        Returns: Json
      }
      get_company_branding: { Args: never; Returns: Json }
      get_configuration_suggestions: {
        Args: {
          p_category_code?: string
          p_country_code?: string
          p_industry_code?: string
          p_organization_id: string
        }
        Returns: {
          category_code: string
          country_code: string
          description: string
          display_name: string
          industry_code: string
          sort_order: number
          suggestion_code: string
          suggestion_id: string
        }[]
      }
      get_delegable_permissions: {
        Args: { p_organization_id: string }
        Returns: {
          description: string
          module: string
          permission_code: string
          permission_id: string
        }[]
      }
      get_equipment_configuration: {
        Args: { p_include_inactive?: boolean; p_organization_id: string }
        Returns: Json
      }
      get_equipment_details: {
        Args: { p_actor_organization_id: string; p_equipment_id: string }
        Returns: Json
      }
      get_equipment_history: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      get_equipment_maintenance_types: {
        Args: { p_include_inactive?: boolean; p_organization_id: string }
        Returns: Json
      }
      get_equipment_replacements: {
        Args: { p_actor_organization_id: string; p_equipment_id: string }
        Returns: Json
      }
      get_equipment_service_relationships: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      get_equipment_specifications: {
        Args: { p_actor_organization_id: string; p_equipment_id: string }
        Returns: Json
      }
      get_job: { Args: { p_job_id: string }; Returns: Json }
      get_job_card: { Args: { p_job_card_id: string }; Returns: Json }
      get_managed_configuration_suggestions: {
        Args: { p_category_code?: string; p_include_inactive?: boolean }
        Returns: {
          category_code: string
          country_code: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          industry_code: string | null
          sort_order: number
          status: string
          suggestion_code: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "configuration_suggestions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_managed_locations: {
        Args: { p_include_inactive?: boolean; p_organization_id: string }
        Returns: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          location_code: string | null
          location_type: string
          name: string
          organization_id: string
          parent_location_id: string | null
          province: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "locations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_managed_members: {
        Args: {
          p_limit?: number
          p_membership_status?: string
          p_offset?: number
          p_organization_id: string
        }
        Returns: {
          application_ids: string[]
          can_manage: boolean
          department_ids: string[]
          email: string
          employee_ref: string
          full_name: string
          is_protected: boolean
          joined_at: string
          location_ids: string[]
          member_id: string
          membership_status: string
          phone: string
          profile_status: string
          role_ids: string[]
          user_id: string
        }[]
      }
      get_managed_organization_applications: {
        Args: { p_organization_id: string }
        Returns: {
          application_code: string
          application_id: string
          application_name: string
          application_status: string
          application_type: string
          assigned_members: number
          is_enabled: boolean
          is_protected: boolean
          is_registered: boolean
        }[]
      }
      get_managed_role_permissions: {
        Args: { p_organization_id: string; p_role_id: string }
        Returns: {
          description: string
          is_delegable: boolean
          module: string
          permission_code: string
          permission_id: string
        }[]
      }
      get_managed_roles: {
        Args: { p_organization_id: string }
        Returns: {
          created_at: string
          description: string
          is_protected: boolean
          is_system_role: boolean
          leadership_key: string
          member_count: number
          permission_count: number
          role_id: string
          role_name: string
          updated_at: string
        }[]
      }
      get_managed_suggestion_categories: {
        Args: { p_include_inactive?: boolean }
        Returns: {
          category_code: string
          created_at: string
          description: string | null
          display_name: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "suggestion_categories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_applications: {
        Args: never
        Returns: {
          application_code: string
          application_id: string
          organization_id: string
          organization_slug: string
        }[]
      }
      get_my_locations: {
        Args: { p_organization_id: string }
        Returns: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          location_code: string | null
          location_type: string
          name: string
          organization_id: string
          parent_location_id: string | null
          province: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "locations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_member_id: { Args: { p_organization_id: string }; Returns: string }
      get_my_permissions: {
        Args: { p_organization_id: string }
        Returns: {
          permission_code: string
        }[]
      }
      get_organization_configuration: {
        Args: { p_organization_id: string }
        Returns: {
          default_value: Json
          description: string
          display_name: string
          effective_value: Json
          is_overridden: boolean
          module: string
          organization_editable: boolean
          setting_key: string
          value_type: string
        }[]
      }
      get_organization_location_types: {
        Args: { p_include_inactive?: boolean; p_organization_id: string }
        Returns: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          status: string
          type_code: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "location_types"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_store_order: { Args: { p_order_id: string }; Returns: Json }
      has_application_access: {
        Args: { p_application_code: string; p_organization_id: string }
        Returns: boolean
      }
      has_equipment_provider_access: {
        Args: {
          p_location_id: string
          p_operation: string
          p_owner_organization_id: string
          p_provider_organization_id: string
        }
        Returns: boolean
      }
      has_location_access: {
        Args: { p_location_id: string; p_organization_id: string }
        Returns: boolean
      }
      has_org_permission: {
        Args: { p_organization_id: string; p_permission_code: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { p_organization_id: string; p_role_name: string }
        Returns: boolean
      }
      invitation_authority_valid: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      inviter_authority_valid: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      inviter_can_assign_resources: {
        Args: {
          p_application_ids: string[]
          p_department_ids: string[]
          p_location_ids: string[]
          p_organization_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      inviter_can_assign_role: {
        Args: {
          p_organization_id: string
          p_role_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: never; Returns: boolean }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_organization_leadership: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_protected_membership: {
        Args: { p_member_id: string; p_organization_id: string }
        Returns: boolean
      }
      is_stgl: { Args: { p_perm: string }; Returns: boolean }
      job_dashboard_summary: { Args: never; Returns: Json }
      job_public_json: {
        Args: {
          p_internal: boolean
          p_job: Database["public"]["Tables"]["jobs"]["Row"]
        }
        Returns: Json
      }
      list_breakdowns: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_organization_id?: string
          p_status?: string
        }
        Returns: Json
      }
      list_equipment: {
        Args: {
          p_actor_organization_id: string
          p_lifecycle_status?: string
          p_limit?: number
          p_location_id?: string
          p_offset?: number
          p_owner_organization_id: string
        }
        Returns: {
          asset_tag: string | null
          condition_code: string | null
          created_at: string
          created_by: string
          description: string | null
          equipment_name: string
          equipment_type_id: string
          id: string
          installed_on: string | null
          lifecycle_status: string
          location_id: string | null
          manufacturer_name: string | null
          model_id: string | null
          model_name: string | null
          notes: string | null
          organization_id: string
          record_version: number
          serial_number: string | null
          supplied_on: string | null
          supplier_name: string | null
          supplier_organization_id: string | null
          updated_at: string
          updated_by: string
          warranty_end_on: string | null
          warranty_start_on: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "equipment"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_equipment_change_requests: {
        Args: {
          p_actor_organization_id: string
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
          p_status?: string
        }
        Returns: Json
      }
      list_equipment_compliance_status: {
        Args: {
          p_actor_organization_id: string
          p_due_within_days?: number
          p_owner_organization_id: string
        }
        Returns: Json
      }
      list_equipment_documents: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_include_archived?: boolean
        }
        Returns: Json
      }
      list_equipment_maintenance_plans: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id?: string
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
        }
        Returns: Json
      }
      list_equipment_maintenance_schedule: {
        Args: {
          p_actor_organization_id: string
          p_due_status?: string
          p_from_date?: string
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
          p_to_date?: string
        }
        Returns: Json
      }
      list_equipment_notification_events: {
        Args: {
          p_actor_organization_id: string
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
        }
        Returns: Json
      }
      list_equipment_notification_events_legacy: {
        Args: {
          p_actor_organization_id: string
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
        }
        Returns: Json
      }
      list_equipment_service_records: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id?: string
          p_include_superseded?: boolean
          p_limit?: number
          p_offset?: number
          p_owner_organization_id: string
        }
        Returns: Json
      }
      list_equipment_verifications: {
        Args: { p_actor_organization_id: string; p_equipment_id: string }
        Returns: Json
      }
      list_inventory: {
        Args: {
          p_limit?: number
          p_low_stock_only?: boolean
          p_offset?: number
          p_search?: string
        }
        Returns: Json
      }
      list_jobs: {
        Args: {
          p_limit?: number
          p_location_id?: string
          p_offset?: number
          p_organization_id?: string
          p_overdue_only?: boolean
          p_status?: string
          p_technician_id?: string
          p_view?: string
        }
        Returns: Json
      }
      list_my_notifications: {
        Args: { p_limit?: number; p_offset?: number; p_unread_only?: boolean }
        Returns: Json
      }
      list_notification_settings: { Args: never; Returns: Json }
      list_org_invitations: {
        Args: { p_organization_id: string }
        Returns: {
          accepted_at: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          invitation_id: string
          invited_by: string
          onboarding_method: string
          status: string
        }[]
      }
      list_stock_movements: {
        Args: { p_limit?: number; p_product_id: string }
        Returns: Json
      }
      list_store_orders: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_organization_id?: string
          p_status?: string
        }
        Returns: Json
      }
      list_store_products: {
        Args: {
          p_category_id?: string
          p_organization_id: string
          p_search?: string
        }
        Returns: Json
      }
      lock_authorized_equipment: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_expected_record_version: number
          p_operation: string
        }
        Returns: {
          asset_tag: string | null
          condition_code: string | null
          created_at: string
          created_by: string
          description: string | null
          equipment_name: string
          equipment_type_id: string
          id: string
          installed_on: string | null
          lifecycle_status: string
          location_id: string | null
          manufacturer_name: string | null
          model_id: string | null
          model_name: string | null
          notes: string | null
          organization_id: string
          record_version: number
          serial_number: string | null
          supplied_on: string | null
          supplier_name: string | null
          supplier_organization_id: string | null
          updated_at: string
          updated_by: string
          warranty_end_on: string | null
          warranty_start_on: string | null
        }
        SetofOptions: {
          from: "*"
          to: "equipment"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lock_equipment_configuration: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      lock_equipment_mutation: {
        Args: {
          p_actor_organization_id: string
          p_owner_organization_id: string
        }
        Returns: undefined
      }
      lock_invitation_resources: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      log_job_event: {
        Args: {
          p_action: string
          p_from: string
          p_job: Database["public"]["Tables"]["jobs"]["Row"]
          p_reason: string
        }
        Returns: undefined
      }
      manage_job: {
        Args: { p_action: string; p_job_id: string; p_reason?: string }
        Returns: Json
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      notify_job_parties: {
        Args: {
          p_body: string
          p_job: Database["public"]["Tables"]["jobs"]["Row"]
          p_title: string
          p_to_client: boolean
          p_to_managers: boolean
          p_to_tech: boolean
          p_type: string
        }
        Returns: undefined
      }
      notify_members: {
        Args: {
          p_body: string
          p_entity_id: string
          p_entity_type: string
          p_exclude?: string
          p_link: string
          p_loc: string
          p_loc_scoped: boolean
          p_org: string
          p_perm: string
          p_title: string
          p_type: string
        }
        Returns: number
      }
      notify_user: {
        Args: {
          p_body: string
          p_entity_id: string
          p_entity_type: string
          p_link: string
          p_org: string
          p_title: string
          p_type: string
          p_user: string
        }
        Returns: undefined
      }
      order_json: {
        Args: { p_o: Database["public"]["Tables"]["store_orders"]["Row"] }
        Returns: Json
      }
      pickup_job: { Args: { p_job_id: string }; Returns: Json }
      place_store_order: {
        Args: {
          p_client_request_key?: string
          p_delivery_instructions?: string
          p_delivery_location_id?: string
          p_lines: Json
          p_organization_id: string
          p_purchase_order_reference?: string
        }
        Returns: Json
      }
      provision_leadership: {
        Args: {
          p_leadership_type: string
          p_user_id: string
          p_verified_email: string
        }
        Returns: Json
      }
      record_equipment_service: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_expected_occurrence_version: number
          p_maintenance_type_id: string
          p_occurrence_id: string
          p_reason: string
          p_service_date: string
          p_service_details: Json
        }
        Returns: Json
      }
      record_equipment_verification: {
        Args: {
          p_actor_organization_id: string
          p_authority?: string
          p_certificate_number?: string
          p_equipment_id: string
          p_notes?: string
          p_outcome: string
          p_seal_number?: string
          p_supersedes_verification_id?: string
          p_valid_until: string
          p_verified_on: string
        }
        Returns: Json
      }
      record_stock_movement: {
        Args: {
          p_movement_type: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference?: string
          p_supplier_reference?: string
        }
        Returns: Json
      }
      register_equipment: {
        Args: {
          p_actor_organization_id: string
          p_asset_tag?: string
          p_description?: string
          p_equipment_name: string
          p_equipment_type_id: string
          p_location_id?: string
          p_model_id?: string
          p_owner_organization_id: string
          p_reason?: string
          p_serial_number?: string
        }
        Returns: Json
      }
      register_equipment_document: {
        Args: {
          p_actor_organization_id: string
          p_document_type: string
          p_equipment_id: string
          p_file_name: string
          p_mime_type?: string
          p_storage_path: string
          p_verification_id?: string
        }
        Returns: Json
      }
      replace_equipment: {
        Args: {
          p_actor_organization_id: string
          p_original_equipment_id: string
          p_original_expected_version: number
          p_reason: string
          p_replacement_equipment_id: string
          p_replacement_expected_version: number
        }
        Returns: Json
      }
      report_breakdown: {
        Args: {
          p_channel?: string
          p_client_request_key?: string
          p_contact_email?: string
          p_contact_name?: string
          p_contact_phone?: string
          p_equipment_id: string
          p_fault_category?: string
          p_fault_description: string
          p_location_id: string
          p_organization_id: string
          p_priority?: string
        }
        Returns: Json
      }
      reschedule_equipment_maintenance_occurrence: {
        Args: {
          p_actor_organization_id: string
          p_expected_version: number
          p_new_due_on: string
          p_occurrence_id: string
          p_reason: string
        }
        Returns: Json
      }
      reset_organization_setting: {
        Args: { p_organization_id: string; p_setting_key: string }
        Returns: Json
      }
      resolve_equipment_change_request: {
        Args: {
          p_actor_organization_id: string
          p_decision: string
          p_reason: string
          p_request_id: string
        }
        Returns: Json
      }
      review_equipment_change_request: {
        Args: {
          p_actor_organization_id: string
          p_reason: string
          p_request_id: string
        }
        Returns: Json
      }
      revoke_user_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      save_company_branding: {
        Args: {
          p_address: string
          p_email: string
          p_legal_name: string
          p_logo_public_url: string
          p_phone: string
          p_registration_number: string
          p_tax_number: string
          p_trading_name: string
          p_website: string
        }
        Returns: Json
      }
      save_configuration_suggestion: {
        Args: {
          p_category_code: string
          p_country_code?: string
          p_description?: string
          p_display_name: string
          p_industry_code?: string
          p_sort_order?: number
          p_status?: string
          p_suggestion_code: string
          p_suggestion_id: string
        }
        Returns: Json
      }
      save_equipment_category: {
        Args: {
          p_category_code: string
          p_description?: string
          p_display_name: string
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
        }
        Returns: Json
      }
      save_equipment_condition: {
        Args: {
          p_condition_code: string
          p_description?: string
          p_display_name: string
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
        }
        Returns: Json
      }
      save_equipment_maintenance_type: {
        Args: {
          p_default_interval_unit?: string
          p_default_interval_value?: number
          p_description?: string
          p_display_name: string
          p_maintenance_type_id: string
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
          p_type_code: string
        }
        Returns: Json
      }
      save_equipment_manufacturer: {
        Args: {
          p_description?: string
          p_manufacturer_id: string
          p_manufacturer_name: string
          p_organization_id: string
          p_status?: string
          p_website_url?: string
        }
        Returns: Json
      }
      save_equipment_model: {
        Args: {
          p_default_specifications?: Json
          p_description?: string
          p_equipment_type_id: string
          p_manufacturer_id: string
          p_model_id: string
          p_model_name: string
          p_model_number?: string
          p_organization_id: string
          p_status?: string
        }
        Returns: Json
      }
      save_equipment_service_relationship: {
        Args: {
          p_capabilities: Json
          p_expected_updated_at: string
          p_location_ids: string[]
          p_owner_organization_id: string
          p_provider_organization_id: string
          p_reason: string
          p_relationship_name: string
          p_scope_type: string
          p_status: string
          p_valid_until: string
        }
        Returns: Json
      }
      save_equipment_specification_field: {
        Args: {
          p_description?: string
          p_display_name: string
          p_equipment_type_id: string
          p_field_code: string
          p_is_required?: boolean
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
          p_unit_label?: string
          p_validation_rules?: Json
          p_value_type: string
        }
        Returns: Json
      }
      save_equipment_specifications: {
        Args: {
          p_actor_organization_id: string
          p_apply_model_defaults: boolean
          p_equipment_id: string
          p_expected_record_version: number
          p_reason: string
          p_values: Json
        }
        Returns: Json
      }
      save_equipment_type: {
        Args: {
          p_category_id: string
          p_description?: string
          p_display_name: string
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
          p_type_code: string
        }
        Returns: Json
      }
      save_location_type: {
        Args: {
          p_description?: string
          p_display_name: string
          p_organization_id: string
          p_sort_order?: number
          p_status?: string
          p_type_code: string
        }
        Returns: Json
      }
      save_notification_setting: {
        Args: {
          p_email: boolean
          p_email_recipients: string[]
          p_event_type: string
          p_in_app: boolean
          p_push: boolean
        }
        Returns: Json
      }
      save_product: {
        Args: {
          p_category_id: string
          p_cost_price?: number
          p_currency?: string
          p_description?: string
          p_image_urls?: string[]
          p_internal_notes?: string
          p_is_active?: boolean
          p_is_published?: boolean
          p_low_stock_threshold?: number
          p_name: string
          p_product_id: string
          p_selling_price: number
          p_sku: string
          p_supplier_reference?: string
          p_unit?: string
        }
        Returns: Json
      }
      save_product_category: {
        Args: {
          p_code: string
          p_name: string
          p_sort_order?: number
          p_status?: string
        }
        Returns: Json
      }
      save_suggestion_category: {
        Args: {
          p_category_code: string
          p_description?: string
          p_display_name: string
          p_status?: string
        }
        Returns: Json
      }
      set_department_status: {
        Args: {
          p_department_id: string
          p_organization_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      set_equipment_lifecycle_status: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_expected_record_version: number
          p_reason: string
          p_target_status: string
        }
        Returns: Json
      }
      set_equipment_maintenance_plan_status: {
        Args: {
          p_actor_organization_id: string
          p_expected_version: number
          p_plan_id: string
          p_reason: string
          p_target_status: string
        }
        Returns: Json
      }
      set_location_status: {
        Args: {
          p_location_id: string
          p_organization_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      set_member_applications: {
        Args: {
          p_application_ids: string[]
          p_expected_application_ids: string[]
          p_member_id: string
          p_organization_id: string
          p_reason: string
        }
        Returns: Json
      }
      set_member_resource_assignments: {
        Args: {
          p_department_ids: string[]
          p_expected_department_ids: string[]
          p_expected_location_ids: string[]
          p_location_ids: string[]
          p_member_id: string
          p_organization_id: string
          p_reason: string
        }
        Returns: Json
      }
      set_member_roles: {
        Args: {
          p_expected_role_ids: string[]
          p_member_id: string
          p_organization_id: string
          p_reason: string
          p_role_ids: string[]
        }
        Returns: Json
      }
      set_member_status: {
        Args: {
          p_expected_status: string
          p_member_id: string
          p_organization_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      set_organization_application_status: {
        Args: {
          p_application_id: string
          p_enabled: boolean
          p_expected_enabled: boolean
          p_organization_id: string
          p_reason: string
        }
        Returns: Json
      }
      set_organization_setting: {
        Args: {
          p_organization_id: string
          p_setting_key: string
          p_value: Json
        }
        Returns: Json
      }
      set_organization_status: {
        Args: { p_organization_id: string; p_reason: string; p_status: string }
        Returns: Json
      }
      set_role_permissions:
        | {
            Args: {
              p_expected_permission_ids: string[]
              p_organization_id: string
              p_permission_ids: string[]
              p_reason: string
              p_role_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_organization_id: string
              p_permission_ids: string[]
              p_reason: string
              p_role_id: string
            }
            Returns: Json
          }
      set_store_order_commercial: {
        Args: {
          p_invoice_reference?: string
          p_order_id: string
          p_payment_status?: string
          p_purchase_order_reference?: string
          p_quotation_reference?: string
        }
        Returns: Json
      }
      set_technician_availability: {
        Args: { p_note?: string; p_status: string }
        Returns: Json
      }
      skip_equipment_maintenance_occurrence: {
        Args: {
          p_actor_organization_id: string
          p_expected_version: number
          p_occurrence_id: string
          p_reason: string
        }
        Returns: Json
      }
      start_equipment_maintenance_occurrence: {
        Args: {
          p_actor_organization_id: string
          p_expected_version: number
          p_occurrence_id: string
          p_reason: string
        }
        Returns: Json
      }
      stgl_organization_id: { Args: never; Returns: string }
      submit_equipment_change_request: {
        Args: {
          p_actor_organization_id: string
          p_equipment_id: string
          p_expected_record_version: number
          p_reason: string
          p_request_payload: Json
          p_request_type: string
        }
        Returns: Json
      }
      technician_home: { Args: never; Returns: Json }
      transfer_equipment: {
        Args: {
          p_actor_organization_id: string
          p_destination_location_id: string
          p_equipment_id: string
          p_expected_record_version: number
          p_reason: string
        }
        Returns: Json
      }
      transition_job: {
        Args: { p_action: string; p_job_id: string; p_reason?: string }
        Returns: Json
      }
      update_breakdown: {
        Args: {
          p_action: string
          p_breakdown_id: string
          p_priority?: string
          p_reason?: string
        }
        Returns: Json
      }
      update_custom_role: {
        Args: {
          p_description: string
          p_name: string
          p_organization_id: string
          p_role_id: string
        }
        Returns: Json
      }
      update_department: {
        Args: {
          p_department_id: string
          p_description: string
          p_name: string
          p_organization_id: string
          p_parent_department_id: string
        }
        Returns: Json
      }
      update_equipment_details: {
        Args: {
          p_actor_organization_id: string
          p_changes: Json
          p_equipment_id: string
          p_expected_record_version: number
          p_reason: string
        }
        Returns: Json
      }
      update_equipment_maintenance_plan: {
        Args: {
          p_actor_organization_id: string
          p_changes: Json
          p_expected_version: number
          p_plan_id: string
          p_reason: string
        }
        Returns: Json
      }
      update_location: {
        Args: {
          p_address: string
          p_city: string
          p_country: string
          p_location_code: string
          p_location_id: string
          p_location_type: string
          p_name: string
          p_organization_id: string
          p_parent_location_id: string
          p_province: string
        }
        Returns: Json
      }
      update_organization: {
        Args: { p_name: string; p_organization_id: string }
        Returns: Json
      }
      update_store_order: {
        Args: { p_action: string; p_order_id: string; p_reason?: string }
        Returns: Json
      }
      user_can_see_location: {
        Args: { p_loc: string; p_org: string; p_user: string }
        Returns: boolean
      }
      user_has_org_permission: {
        Args: { p_org: string; p_perm: string; p_user: string }
        Returns: boolean
      }
      user_has_organization_permission: {
        Args: {
          p_organization_id: string
          p_permission_code: string
          p_user_id: string
        }
        Returns: boolean
      }
      validate_configuration_value: {
        Args: { p_configuration_id: string; p_value: Json }
        Returns: boolean
      }
      validate_department_parent: {
        Args: {
          p_department_id: string
          p_organization_id: string
          p_parent_department_id: string
        }
        Returns: boolean
      }
      validate_equipment_model_defaults: {
        Args: {
          p_defaults: Json
          p_equipment_type_id: string
          p_organization_id: string
        }
        Returns: boolean
      }
      validate_equipment_readiness: {
        Args: { p_equipment_id: string }
        Returns: undefined
      }
      validate_equipment_specification_rules: {
        Args: { p_rules: Json; p_value_type: string }
        Returns: boolean
      }
      validate_equipment_specification_value: {
        Args: { p_rules: Json; p_value: Json; p_value_type: string }
        Returns: boolean
      }
      validate_invitation_resources: {
        Args: {
          p_application_ids: string[]
          p_department_ids: string[]
          p_location_ids: string[]
          p_organization_id: string
        }
        Returns: boolean
      }
      validate_location_parent: {
        Args: {
          p_location_id: string
          p_organization_id: string
          p_parent_location_id: string
        }
        Returns: boolean
      }
      write_equipment_configuration_audit: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_new_values: Json
          p_old_values: Json
          p_organization_id: string
        }
        Returns: undefined
      }
      write_shared_equipment_audit: {
        Args: {
          p_action: string
          p_actor_organization_id: string
          p_equipment_id: string
          p_new_values: Json
          p_old_values: Json
          p_owner_organization_id: string
          p_reason: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
