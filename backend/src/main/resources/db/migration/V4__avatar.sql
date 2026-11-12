-- Photo de profil téléversée depuis l'admin (recadrée et convertie côté navigateur, 512×512).
create table avatar_image (
    id           bigint primary key check (id = 1),
    content_type varchar(40)  not null check (content_type in ('image/webp', 'image/png', 'image/jpeg')),
    size_bytes   bigint       not null,
    content      bytea        not null,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);
