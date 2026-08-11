-- D144: history FKs move from ON DELETE CASCADE to ON DELETE RESTRICT.
-- Supersedes D53 (session_entries) and D90.3's accepted hole
-- (coa_retirements). Design: documentation/design/coa-delete-restrict.md

alter table public.coa_retirements
  drop constraint coa_retirements_coa_id_fkey,
  add constraint coa_retirements_coa_id_fkey
    foreign key (coa_id) references public.coas(id) on delete restrict;

alter table public.session_entries
  drop constraint session_entries_coa_id_fkey,
  add constraint session_entries_coa_id_fkey
    foreign key (coa_id) references public.coas(id) on delete restrict;
