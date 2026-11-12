-- Traductions manuelles (anglais) des champs de contenu, et version publiée de la vitrine.

create table translation (
    id         bigserial primary key,
    entity     varchar(30)  not null,
    entity_id  bigint       not null,
    field      varchar(50)  not null,
    lang       varchar(5)   not null default 'en',
    text_value text,
    list_value text[],
    updated_at timestamptz  not null default now(),
    unique (entity, entity_id, field, lang)
);

-- Instantané publié par langue : c'est lui que voient les visiteurs (le contenu édité reste un brouillon).
create table published_snapshot (
    lang         varchar(5)  primary key,
    content      jsonb       not null,
    content_hash varchar(64) not null,
    published_at timestamptz not null default now()
);
