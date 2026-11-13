-- Témoignages / recommandations (uniquement des recommandations réelles, saisies dans l'admin).
create table testimonial (
    id           bigserial primary key,
    author       varchar(120) not null,
    role         varchar(160),
    company      varchar(160),
    relationship varchar(160),
    quote        text         not null,
    linkedin_url varchar(300),
    sort_order   integer      not null default 0,
    visible      boolean      not null default true,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);

-- Nouvelle section, placée avant « contact » et masquée tant qu'aucun témoignage n'a été ajouté.
update site_settings
set section_order   = array_remove(section_order, 'contact') || array['testimonials', 'contact'],
    hidden_sections = hidden_sections || array['testimonials']
where not ('testimonials' = any (section_order));
