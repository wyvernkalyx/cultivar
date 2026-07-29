-- Drop the dormant coas.pdf_url column (D87.3's banked chore:).
--
-- pdf_url was inherited from the original coas schema and has been
-- dormant since creation: never written by any code path, 0 non-null
-- values architect-observed 2026-07-29. D87.3 superseded it with
-- pdf_object_path, which stores the Storage object path rather than a
-- URL, and explicitly banked this removal as its own chore: gated on a
-- grep over the client.
--
-- Gate observed before authoring: grep -rn "pdf_url" src/ -> 0 hits,
-- exit 1; grep -rn "pdf_url" supabase/functions/ -> 0 hits, exit 1.
-- No reference in any public function or view either (architect-observed
-- over MCP 2026-07-29: insert_coa, find_coa_duplicates, retire_coa,
-- handle_new_user, coa_session_stats, session_current all clean).
--
-- Nothing recorded is destroyed by this drop: the column holds no data.

alter table public.coas drop column pdf_url;
