-- Historique des questions posées à l'assistant IA et avis des visiteurs (👍 / 👎).
create table assistant_exchange (
    id             bigserial primary key,
    question       varchar(500) not null,
    answer         text,
    sources        text[]       not null default '{}',
    status         varchar(20)  not null default 'ANSWERED' check (status in ('ANSWERED', 'ERROR', 'REFUSED')),
    feedback       smallint     check (feedback in (-1, 1)),
    feedback_token varchar(36)  not null,
    model          varchar(60),
    duration_ms    integer,
    created_at     timestamptz  not null default now()
);

create index idx_assistant_exchange_created_at on assistant_exchange (created_at desc);
