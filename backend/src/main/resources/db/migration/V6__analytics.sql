-- Statistiques de visite anonymes, sans cookie : aucune IP ni donnée personnelle n'est stockée.
-- visitor_hash = SHA-256(sel du jour + IP + navigateur), le sel change chaque jour et n'est jamais enregistré.
create table analytics_event (
    id            bigserial primary key,
    type          varchar(30)  not null check (type in ('PAGE_VIEW', 'PROJECT_VIEW', 'CV_DOWNLOAD',
                                                       'ASSISTANT_QUESTION', 'CONTACT_MESSAGE')),
    path          varchar(200),
    project_slug  varchar(80),
    referrer_host varchar(120),
    device        varchar(10)  not null default 'desktop',
    visitor_hash  varchar(16)  not null,
    created_at    timestamptz  not null default now()
);

create index idx_analytics_created_at on analytics_event (created_at);
create index idx_analytics_type_created_at on analytics_event (type, created_at);
