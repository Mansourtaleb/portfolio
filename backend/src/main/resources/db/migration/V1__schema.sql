-- Schéma du portfolio : chaque section de la vitrine est une table éditable depuis l'espace admin.

create table admin_user (
    id            bigserial primary key,
    username      varchar(60)  not null unique,
    password_hash varchar(100) not null,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now()
);

-- Sections « singleton » (une seule ligne, id = 1)

create table profile (
    id            bigint primary key check (id = 1),
    full_name     varchar(120) not null,
    headline      varchar(200) not null,
    tagline       varchar(300),
    summary       text,
    location      varchar(120),
    email         varchar(160),
    phone         varchar(40),
    show_phone    boolean      not null default false,
    linkedin_url  varchar(300),
    github_url    varchar(300),
    cv_url        varchar(300),
    avatar_url    varchar(300),
    availability  varchar(160),
    qualities     text[]       not null default '{}',
    extras        text[]       not null default '{}',
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now()
);

create table site_settings (
    id                    bigint primary key check (id = 1),
    site_title            varchar(160) not null,
    meta_description      varchar(300),
    default_theme         varchar(10)  not null default 'dark' check (default_theme in ('dark', 'light')),
    section_order         text[]       not null default '{}',
    hidden_sections       text[]       not null default '{}',
    assistant_enabled     boolean      not null default true,
    assistant_greeting    varchar(500),
    assistant_suggestions text[]       not null default '{}',
    contact_form_enabled  boolean      not null default true,
    created_at            timestamptz  not null default now(),
    updated_at            timestamptz  not null default now()
);

-- Sections « liste » : ordre d'affichage (sort_order) + visibilité

create table skill_group (
    id         bigserial primary key,
    name       varchar(120) not null,
    icon       varchar(60),
    items      text[]       not null default '{}',
    sort_order integer      not null default 0,
    visible    boolean      not null default true,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table experience (
    id         bigserial primary key,
    role       varchar(160) not null,
    company    varchar(160) not null,
    location   varchar(120),
    period     varchar(80)  not null,
    kind       varchar(60),
    summary    text,
    highlights text[]       not null default '{}',
    stack      text[]       not null default '{}',
    sort_order integer      not null default 0,
    visible    boolean      not null default true,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table project (
    id                bigserial primary key,
    slug              varchar(80)  not null unique,
    title             varchar(120) not null,
    tagline           varchar(300),
    context           varchar(200),
    period            varchar(80),
    status            varchar(20)  not null default 'DONE' check (status in ('DONE', 'IN_PROGRESS')),
    summary           text,
    description       text,
    role              text,
    highlights        text[]       not null default '{}',
    stack             text[]       not null default '{}',
    repo_url          varchar(300),
    demo_url          varchar(300),
    confidential      boolean      not null default false,
    confidential_note varchar(300),
    featured          boolean      not null default false,
    sort_order        integer      not null default 0,
    visible           boolean      not null default true,
    created_at        timestamptz  not null default now(),
    updated_at        timestamptz  not null default now()
);

create table education (
    id          bigserial primary key,
    degree      varchar(200) not null,
    field       varchar(200),
    school      varchar(160) not null,
    location    varchar(120),
    period      varchar(80),
    mention     varchar(80),
    description text,
    sort_order  integer      not null default 0,
    visible     boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now()
);

create table certification (
    id             bigserial primary key,
    name           varchar(200) not null,
    issuer         varchar(120) not null,
    issued_on      varchar(40),
    credential_url varchar(300),
    sort_order     integer      not null default 0,
    visible        boolean      not null default true,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);

create table spoken_language (
    id         bigserial primary key,
    name       varchar(60)  not null,
    level      varchar(80)  not null,
    sort_order integer      not null default 0,
    visible    boolean      not null default true,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

-- Fiches réservées à l'assistant IA (non affichées sur le site)
create table knowledge_entry (
    id         bigserial primary key,
    title      varchar(160) not null,
    content    text         not null,
    sort_order integer      not null default 0,
    visible    boolean      not null default true,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table contact_message (
    id         bigserial primary key,
    name       varchar(120) not null,
    email      varchar(160) not null,
    subject    varchar(200),
    message    text         not null,
    read_at    timestamptz,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create index idx_contact_message_created_at on contact_message (created_at desc);
