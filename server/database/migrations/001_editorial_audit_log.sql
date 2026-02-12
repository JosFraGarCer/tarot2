-- Migration: Create editorial_audit_log table
-- Purpose: Persist who changed what status, when, and why.
-- This table is append-only. No updates or deletes should be performed.

CREATE TABLE public.editorial_audit_log (
  id serial4 NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id int4 NOT NULL,
  from_status varchar(50) NOT NULL,
  to_status varchar(50) NOT NULL,
  user_id int4 NULL,
  reason text NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT editorial_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT editorial_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_editorial_audit_log_entity ON public.editorial_audit_log USING btree (entity_type, entity_id);
CREATE INDEX idx_editorial_audit_log_user ON public.editorial_audit_log USING btree (user_id);
CREATE INDEX idx_editorial_audit_log_created_at ON public.editorial_audit_log USING btree (created_at DESC);

COMMENT ON TABLE public.editorial_audit_log IS 'Append-only log of editorial status transitions. Tracks who changed what status, when.';
