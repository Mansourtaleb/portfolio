resource "kubernetes_namespace_v1" "portfolio" {
  metadata {
    name = var.namespace
  }
}

# Mots de passe générés par Terraform : personne ne les tape ni ne les voit
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "kubernetes_secret_v1" "app" {
  metadata {
    name      = "portfolio-secrets"
    namespace = kubernetes_namespace_v1.portfolio.metadata[0].name
  }
  data = {
    DB_PASSWORD    = random_password.db.result
    JWT_SECRET     = random_password.jwt.result
    ADMIN_PASSWORD = var.admin_password
  }
}

# La release Helm n'est plus gérée ici : c'est le pipeline Jenkins (CD) qui
# déploie chaque nouvelle version avec « helm upgrade ».
# Terraform = la plateforme (namespace, secrets) ; Jenkins = l'application.