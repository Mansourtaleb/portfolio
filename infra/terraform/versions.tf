# Versions de Terraform et des providers (figées pour un résultat reproductible)
terraform {
  required_version = ">= 1.6"
  required_providers {
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.38" }
    helm       = { source = "hashicorp/helm", version = "~> 3.0" }
    random     = { source = "hashicorp/random", version = "~> 3.7" }
  }
}

# Connexion au cluster kind (contexte créé par « kind create cluster »)
provider "kubernetes" {
  config_path    = pathexpand("~/.kube/config")
  config_context = var.kube_context
}

provider "helm" {
  kubernetes = {
    config_path    = pathexpand("~/.kube/config")
    config_context = var.kube_context
  }
}