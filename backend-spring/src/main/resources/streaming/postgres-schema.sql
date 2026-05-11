-- Streaming platform relational schema (PostgreSQL 15+)
-- Focused on durable stream, session, moderation, and analytics domains.

create extension if not exists pgcrypto;

-- Core identity tables (reference model for services backed by PostgreSQL)
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email varchar(320) not null unique,
    username varchar(64) unique,
    display_name varchar(180) not null,
    status varchar(32) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists roles (
    id smallserial primary key,
    code varchar(40) not null unique,
    description text
);

create table if not exists user_roles (
    user_id uuid not null references users(id) on delete cascade,
    role_id smallint not null references roles(id) on delete cascade,
    granted_at timestamptz not null default now(),
    granted_by uuid references users(id),
    primary key (user_id, role_id)
);

create table if not exists streams (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references users(id) on delete restrict,
    title varchar(220) not null,
    description text,
    mode varchar(32) not null check (mode in ('ONE_TO_ONE', 'ONE_TO_MANY')),
    media_kind varchar(32) not null check (media_kind in ('AUDIO', 'VIDEO', 'AUDIO_VIDEO')),
    visibility varchar(32) not null check (visibility in ('PUBLIC', 'PRIVATE', 'UNLISTED')),
    status varchar(32) not null check (status in ('DRAFT', 'LIVE', 'ENDED', 'TERMINATED')),
    recording_enabled boolean not null default false,
    low_latency_enabled boolean not null default true,
    playback_enabled boolean not null default true,
    max_participants integer not null default 5000,
    primary_region varchar(64) not null default 'global-primary',
    janus_room_id varchar(128),
    ingest_key_hash varchar(255),
    live_hls_url text,
    playback_hls_url text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    ended_at timestamptz,
    updated_at timestamptz not null default now()
);

create table if not exists stream_sessions (
    id uuid primary key default gen_random_uuid(),
    stream_id uuid not null references streams(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    role_snapshot varchar(32) not null check (role_snapshot in ('USER', 'OWNER', 'ADMIN')),
    protocol varchar(24) not null check (protocol in ('WEBRTC', 'HLS', 'MIXED')),
    edge_region varchar(64) not null default 'global-primary',
    ip_address inet,
    user_agent text,
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    duration_seconds integer generated always as (
      case
        when left_at is null then null
        else greatest(0, extract(epoch from (left_at - joined_at)))::integer
      end
    ) stored
);

create table if not exists stream_messages (
    id uuid primary key default gen_random_uuid(),
    stream_id uuid not null references streams(id) on delete cascade,
    sender_user_id uuid references users(id) on delete set null,
    sender_display_name varchar(180) not null,
    body text not null,
    moderation_status varchar(24) not null default 'VISIBLE' check (moderation_status in ('VISIBLE', 'HIDDEN', 'REMOVED')),
    created_at timestamptz not null default now()
);

create table if not exists stream_bans (
    id uuid primary key default gen_random_uuid(),
    stream_id uuid references streams(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    scope varchar(24) not null check (scope in ('STREAM', 'GLOBAL')),
    reason text not null,
    active boolean not null default true,
    created_by uuid references users(id),
    created_at timestamptz not null default now(),
    expires_at timestamptz,
    unique (stream_id, user_id, scope)
);

create table if not exists stream_reports (
    id uuid primary key default gen_random_uuid(),
    stream_id uuid not null references streams(id) on delete cascade,
    reported_user_id uuid references users(id) on delete set null,
    reporter_user_id uuid references users(id) on delete set null,
    category varchar(64) not null,
    detail text,
    status varchar(24) not null default 'OPEN' check (status in ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
    created_at timestamptz not null default now(),
    resolved_at timestamptz,
    resolved_by uuid references users(id)
);

create table if not exists stream_metrics_minute (
    stream_id uuid not null references streams(id) on delete cascade,
    ts_minute timestamptz not null,
    viewer_count integer not null default 0,
    unique_chatters integer not null default 0,
    avg_rtt_ms integer,
    avg_jitter_ms integer,
    packet_loss_ratio numeric(7, 5),
    hls_buffer_seconds numeric(8, 3),
    webrtc_active_participants integer not null default 0,
    hls_active_viewers integer not null default 0,
    created_at timestamptz not null default now(),
    primary key (stream_id, ts_minute)
);

-- Index strategy for high-cardinality queries and hot paths
create index if not exists idx_streams_owner_created on streams (owner_user_id, created_at desc);
create index if not exists idx_streams_status_started on streams (status, started_at desc);
create index if not exists idx_streams_visibility_status on streams (visibility, status, created_at desc);
create index if not exists idx_streams_live_partial on streams (started_at desc) where status = 'LIVE';

create index if not exists idx_sessions_stream_joined on stream_sessions (stream_id, joined_at desc);
create index if not exists idx_sessions_user_joined on stream_sessions (user_id, joined_at desc);
create index if not exists idx_sessions_active on stream_sessions (stream_id, joined_at desc) where left_at is null;

create index if not exists idx_messages_stream_created on stream_messages (stream_id, created_at desc);
create index if not exists idx_messages_sender_created on stream_messages (sender_user_id, created_at desc);
create index if not exists idx_messages_moderation on stream_messages (stream_id, moderation_status, created_at desc);

create index if not exists idx_bans_active_stream on stream_bans (stream_id, user_id) where active = true and scope = 'STREAM';
create index if not exists idx_bans_active_global on stream_bans (user_id) where active = true and scope = 'GLOBAL';

create index if not exists idx_reports_status_created on stream_reports (status, created_at desc);
create index if not exists idx_reports_stream_created on stream_reports (stream_id, created_at desc);

create index if not exists idx_metrics_ts on stream_metrics_minute (ts_minute desc);
create index if not exists idx_metrics_stream_ts on stream_metrics_minute (stream_id, ts_minute desc);

-- Seed core roles used by RBAC
insert into roles (code, description)
values
    ('USER', 'Can watch streams and participate in chat'),
    ('OWNER', 'Can create/manage own streams'),
    ('ADMIN', 'Can moderate globally and administer streams')
on conflict (code) do nothing;
