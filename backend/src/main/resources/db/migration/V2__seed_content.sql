-- Contenu initial, repris du CV (version Carrefour, novembre 2026) et des notes validées.
-- Tout est modifiable ensuite depuis l'espace admin.

insert into profile (id, full_name, headline, tagline, summary, location, email, phone, show_phone,
                     linkedin_url, github_url, cv_url, avatar_url, availability, qualities, extras)
values (1,
        'Mohamed Mansour TALEB',
        'Ingénieur Full-Stack — Systèmes intelligents & IA appliquée',
        'Je conçois des systèmes intelligents, sécurisés et évolutifs, du besoin métier jusqu''au déploiement.',
        'Ingénieur Full-Stack & IA, je développe des systèmes intelligents, sécurisés et évolutifs : architectures microservices, modèles de Machine Learning intégrés aux processus métier, automatisation et déploiement continu. Maîtrise de Java / Spring Boot, Angular et Python. Rigoureux et orienté résultats, je transforme des besoins complexes en solutions performantes.',
        'Bizerte, Tunisie',
        'MohamedMansour.Taleb@esprit.tn',
        null, false,
        'https://www.linkedin.com/in/mohamed-mansour-taleb-316115230',
        'https://github.com/Mansourtaleb',
        null, null,
        'Disponible immédiatement',
        array['Autonomie', 'Rigueur', 'Esprit d''équipe', 'Apprentissage rapide', 'Sens du service'],
        array['Vie associative : Tunivision Bizerte (2023 – 2024)', 'Permis B']);

insert into site_settings (id, site_title, meta_description, default_theme, section_order, hidden_sections,
                           assistant_enabled, assistant_greeting, assistant_suggestions, contact_form_enabled)
values (1,
        'Mohamed Mansour TALEB — Ingénieur Full-Stack & IA',
        'Portfolio de Mohamed Mansour TALEB, ingénieur Full-Stack (Java / Spring Boot, Angular, Python) orienté IA appliquée.',
        'dark',
        array['about', 'skills', 'experience', 'projects', 'education', 'contact'],
        array[]::text[],
        true,
        'Bonjour ! Je suis l''assistant IA de Mohamed Mansour. Posez-moi vos questions sur son parcours, ses compétences ou ses projets.',
        array['Quelles sont ses compétences principales ?', 'Parle-moi du projet FinancAuto', 'Quelle expérience a-t-il en IA ?', 'Est-il disponible ?'],
        true);

insert into skill_group (name, icon, items, sort_order) values
('Back-end', 'server',
 array['Java', 'Spring Boot', 'Spring Security (JWT, rôles)', 'Spring Cloud (microservices)', 'API REST', 'Python / FastAPI', 'Symfony'], 1),
('Front-end & mobile', 'layout',
 array['Angular', 'TypeScript', 'RxJS', 'FlutterFlow'], 2),
('Données', 'database',
 array['PostgreSQL', 'MongoDB', 'MySQL', 'Firebase', 'SQL'], 3),
('IA appliquée', 'brain',
 array['Machine Learning (scikit-learn, pandas)', 'Explicabilité (SHAP)', 'OCR (Tesseract)', 'Détection d''anomalies', 'IA générative'], 4),
('DevOps & cloud', 'cloud',
 array['Docker', 'Docker Compose', 'CI/CD (GitHub Actions, Jenkins)', 'Git', 'Linux', 'AWS'], 5),
('Méthodes & qualité', 'checklist',
 array['Scrum', 'UML', 'Analyse des besoins', 'Tests et recette', 'JUnit', 'Postman', 'Jira'], 6),
('Réseaux', 'network',
 array['TCP/IP', 'Adressage IP', 'VLAN', 'Configuration de routeurs', 'Diagnostic', 'Fibre FTTH'], 7);

insert into experience (role, company, location, period, kind, summary, highlights, stack, sort_order) values
('Ingénieur Logiciel Full-Stack', 'Teamwill', 'Tunis', 'Févr. 2026 – Août 2026', 'Stage PFE',
 'Conception et développement de FinancAuto, plateforme web de demande de financement leasing automobile.',
 array['Développement complet en 6 mois d''une plateforme web pour 6 types d''utilisateurs, de l''analyse des besoins jusqu''au déploiement.',
       'Sécurisation des accès (JWT, droits par rôle) et intégration d''un scoring de crédit par IA (3 modèles comparés).',
       'Automatisation de 3 traitements planifiés (relances, alertes, rappels) et déploiement Docker.'],
 array['Java', 'Spring Boot', 'Angular', 'PostgreSQL', 'Python', 'FastAPI', 'Docker'], 1),
('Stagiaire Développeur / QA', 'Zedney Creative', null, 'Juin 2025 – Juil. 2025', 'Stage',
 'Qualité logicielle sur une plateforme SaaS de facturation.',
 array['Tests fonctionnels et correction d''anomalies (back-end et front-end) sur 5 modules d''une plateforme SaaS de facturation : devis, factures, paiements, PDF et tableau de bord.'],
 array['NestJS', 'Next.js / React', 'TypeScript', 'MySQL'], 2),
('Stagiaire Réseaux & Télécoms', 'Tunisie Télécom', 'Bizerte', 'Juil. 2024 – Août 2024', 'Stage',
 null,
 array['6 semaines en réseaux d''accès : modems, routeurs, fibre FTTH, tests de lignes et assistance clients.'],
 array[]::text[], 3),
('Stagiaire en industrie', 'SNDP Agil, YAZAKI, Ciments de Bizerte, STEG', 'Bizerte / Tunis', '2019 – 2022', 'Stages',
 null,
 array['4 stages : réalisation d''une machine CNC de pliage de carton (SNDP Agil, projet noté Excellent), contrôle qualité et maintenance d''équipements industriels.'],
 array[]::text[], 4);

insert into project (slug, title, tagline, context, period, status, summary, description, role,
                     highlights, stack, repo_url, demo_url, confidential, confidential_note, featured, sort_order, visible) values
('financauto', 'FinancAuto',
 'Plateforme de demande de financement leasing automobile avec scoring de crédit par IA',
 'Stage PFE · Teamwill', 'Févr. 2026 – Août 2026', 'DONE',
 'Plateforme web complète de demande de financement leasing automobile, du dépôt du dossier à la décision de crédit, pour 6 types d''utilisateurs.',
 'FinancAuto digitalise le parcours de financement leasing automobile : simulation, constitution du dossier, vérification des pièces, analyse et décision de crédit. Une API Spring Boot orchestre un workflow multi-acteurs, un microservice Python calcule un score de crédit par Machine Learning, et les pièces justificatives sont contrôlées par OCR.',
 'Projet réalisé en autonomie complète : analyse des besoins, conception, développement back-end et front-end, intégration de l''IA et déploiement.',
 array['API REST Java / Spring Boot et base PostgreSQL ; interface Angular avec un espace dédié par rôle',
       'Sécurité : authentification JWT et droits d''accès par rôle (6 rôles)',
       'Scoring de crédit par Machine Learning : microservice Python / FastAPI, 3 modèles comparés',
       'Vérification documentaire par OCR (Tesseract)',
       '3 traitements planifiés automatisés : relances, alertes et rappels',
       'Conteneurisation et déploiement avec Docker Compose'],
 array['Java', 'Spring Boot', 'Spring Security', 'Angular', 'PostgreSQL', 'Python', 'FastAPI', 'scikit-learn', 'OCR', 'Docker'],
 null, null, true, 'Code propriété de Teamwill (clause de confidentialité) : non publié. Architecture et choix techniques présentables en entretien.',
 true, 1, true),
('timeforge', 'TimeForge',
 'Plateforme collaborative de gestion de projets',
 'Projet ESPRIT · équipe de 5', 'Déc. 2024 – 2025', 'DONE',
 'Gestion de projets collaborative en architecture microservices, avec messagerie et notifications en temps réel et une interface mobile.',
 'TimeForge permet à des équipes de piloter leurs projets. L''application repose sur une architecture microservices Spring Cloud ; la partie collaboration apporte une messagerie temps réel et des notifications automatiques, accessibles aussi depuis une interface mobile.',
 'Responsable du microservice de messagerie et des notifications temps réel (Spring Boot, MongoDB, Angular) et de l''interface mobile associée (FlutterFlow, Firebase).',
 array['Architecture microservices Spring Cloud (Gateway, Eureka, Config Server)',
       'Chat temps réel de groupe et individuel (WebSocket / STOMP) : mentions, statut en ligne, historique',
       'Notifications temps réel et interface mobile FlutterFlow + Firebase',
       'Conteneurisation Docker et pipeline CI/CD GitHub Actions'],
 array['Spring Boot', 'Spring Cloud', 'MongoDB', 'WebSocket / STOMP', 'Angular', 'FlutterFlow', 'Firebase', 'Docker', 'GitHub Actions'],
 null, null, false, null, false, 2, true),
('jobseeker', 'JobSeeker',
 'Plateforme de recrutement avec matching CV / offre par IA',
 'Projet ESPRIT', 'Sept. 2024 – Déc. 2024', 'DONE',
 'Plateforme de recrutement : offres, candidatures, profils candidats, espace administrateur et analyse des CV par IA.',
 'JobSeeker met en relation candidats et recruteurs : publication des offres, dépôt de CV, suivi des candidatures et administration de la plateforme, avec une IA qui rapproche les CV des offres.',
 null,
 array['Gestion des offres d''emploi, des candidatures et des profils candidats avec dépôt de CV',
       'Rôles candidat, recruteur et administrateur ; back-office d''administration',
       'E-mails automatiques à chaque étape de la candidature',
       'Matching CV / offre et analyse automatique des CV par IA'],
 array['Symfony', 'PHP', 'Twig', 'Bootstrap', 'JavaScript'],
 null, null, false, null, false, 3, true),
('shopflow', 'ShopFlow',
 'Plateforme e-commerce avec recommandations de produits par IA',
 'Projet personnel', null, 'IN_PROGRESS',
 'Catalogue, panier, paiement en ligne et recommandations de produits par IA.',
 null, null,
 array[]::text[],
 array['Spring Boot', 'Angular', 'Docker'],
 null, null, false, null, false, 4, false);

insert into education (degree, field, school, location, period, mention, description, sort_order) values
('Diplôme National d''Ingénieur en Informatique', 'Génie Logiciel', 'ESPRIT', 'Ariana', '2023 – 2026', 'Très Bien', null, 1),
('Licence Nationale en Génie Électrique', 'Électronique Industrielle', 'ISET Bizerte', 'Bizerte', '2023', null,
 'Projet de fin d''études : machine CNC de pliage de carton (SNDP Agil), mention Excellent.', 2);

insert into certification (name, issuer, issued_on, credential_url, sort_order) values
('Applications of AI for Anomaly Detection', 'NVIDIA', 'Nov. 2025', null, 1),
('Generative AI', 'NVIDIA', null, null, 2),
('AWS Academy Graduate — Cloud Foundations', 'Amazon Web Services', 'Nov. 2025', 'https://www.credly.com/go/CTivV2Tk', 3);

insert into spoken_language (name, level, sort_order) values
('Arabe', 'Langue maternelle', 1),
('Français', 'B2', 2),
('Anglais', 'B2', 3);

insert into knowledge_entry (title, content, sort_order) values
('Disponibilité et contact',
 'Mohamed Mansour est disponible immédiatement. Il est basé à Bizerte, en Tunisie. Le plus simple pour le contacter est l''e-mail MohamedMansour.Taleb@esprit.tn ou LinkedIn.', 1),
('Confidentialité de FinancAuto',
 'Le code de FinancAuto appartient à Teamwill et est couvert par une clause de confidentialité : il n''est pas publié. Mohamed Mansour peut en présenter l''architecture et les choix techniques en entretien.', 2),
('Double formation électronique et logiciel',
 'Avant le génie logiciel, Mohamed Mansour a obtenu une licence en génie électrique (électronique industrielle) à l''ISET Bizerte. Il a effectué 4 stages industriels (STEG, Ciments de Bizerte, YAZAKI, SNDP Agil), dont la réalisation d''une machine CNC de pliage de carton notée Excellent. Il pratique le C embarqué (Arduino, PIC, STM32, ESP32) et les automates Siemens (TIA Portal, Ladder, Grafcet). Cette double formation lui apporte une culture du terrain industriel et beaucoup de rigueur.', 3);
