-- Schéma d'architecture des projets (une couche par ligne : « Nom | description ») et CV PDF téléversé.

alter table project add column architecture text[] not null default '{}';

update project set architecture = array[
    'Front-end Angular | 6 espaces par rôle, appels REST sécurisés par JWT',
    'API Spring Boot | Workflow multi-acteurs, sécurité JWT et rôles, traitements planifiés',
    'Microservice Python / FastAPI | Scoring de crédit par Machine Learning',
    'OCR (Tesseract) | Vérification des pièces justificatives',
    'PostgreSQL | Données des dossiers de financement',
    'Docker Compose | Conteneurisation et déploiement']
where slug = 'financauto';

update project set architecture = array[
    'Front-end Angular + mobile FlutterFlow | Interfaces web et mobile',
    'Spring Cloud Gateway | Point d''entrée unique, sécurité JWT',
    'Eureka + Config Server | Découverte des services et configuration centralisée',
    'Microservice Collaboration | Chat temps réel (WebSocket / STOMP) et notifications',
    'MongoDB + Firebase | Messages, historique et notifications mobiles',
    'Docker + GitHub Actions | Conteneurisation et CI/CD']
where slug = 'timeforge';

update project set architecture = array[
    'Interface Twig + Bootstrap | Espaces candidat, recruteur et administrateur',
    'Application Symfony (PHP) | Offres, candidatures, profils et rôles',
    'Module IA | Matching CV / offre et analyse automatique des CV',
    'E-mails automatiques | Suivi de chaque étape de la candidature']
where slug = 'jobseeker';

create table cv_document (
    id           bigint primary key check (id = 1),
    file_name    varchar(200) not null,
    content_type varchar(100) not null,
    size_bytes   bigint       not null,
    content      bytea        not null,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);
