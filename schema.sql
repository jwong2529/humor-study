create table public.captions (
  id uuid not null default gen_random_uuid (),
  created_datetime_utc timestamp with time zone not null default now(),
  modified_datetime_utc timestamp with time zone null,
  content character varying null,
  is_public boolean not null,
  profile_id uuid not null,
  image_id uuid not null,
  humor_flavor_id bigint null,
  is_featured boolean not null default false,
  caption_request_id bigint null,
  like_count bigint not null default '0'::bigint,
  llm_prompt_chain_id bigint null,
  constraint captions_pkey primary key (id),
  constraint captions_caption_request_id_fkey foreign KEY (caption_request_id) references caption_requests (id) on update CASCADE on delete CASCADE,
  constraint captions_humor_flavor_id_fkey foreign KEY (humor_flavor_id) references humor_flavors (id) on delete set null,
  constraint captions_image_id_fkey foreign KEY (image_id) references images (id) on delete CASCADE,
  constraint captions_llm_prompt_chain_id_fkey foreign KEY (llm_prompt_chain_id) references llm_prompt_chains (id) on delete CASCADE,
  constraint captions_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_captions_image_id on public.captions using btree (image_id) TABLESPACE pg_default;

create index IF not exists idx_captions_like_count_desc_id on public.captions using btree (like_count desc, id) TABLESPACE pg_default;

create table public.caption_votes (
  user_id uuid not null,
  caption_id uuid not null,
  vote_value smallint not null,
  constraint caption_votes_pkey primary key (user_id, caption_id),
  constraint caption_votes_caption_id_fkey foreign key (caption_id) references captions (id) on delete cascade,
  constraint caption_votes_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;
