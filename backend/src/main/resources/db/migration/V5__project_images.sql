-- Galerie de captures d'écran par projet (redimensionnées en WebP côté navigateur).
create table project_image (
    id           bigserial primary key,
    project_id   bigint       not null references project (id) on delete cascade,
    content_type varchar(40)  not null check (content_type in ('image/webp', 'image/png', 'image/jpeg')),
    size_bytes   bigint       not null,
    width        integer,
    height       integer,
    caption      varchar(200),
    content      bytea        not null,
    sort_order   integer      not null default 0,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);

create index idx_project_image_project on project_image (project_id, sort_order);
