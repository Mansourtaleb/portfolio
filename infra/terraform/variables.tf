variable "kube_context" {
  description = "Contexte kubectl du cluster cible"
  type        = string
  default     = "kind-portfolio"
}

variable "namespace" {
  description = "Namespace du portfolio"
  type        = string
  default     = "portfolio"
}

variable "image_tag" {
  description = "Version des images publiées par Jenkins dans Nexus"
  type        = string
  default     = "1.0.11"
}

variable "web_replicas" {
  description = "Nombre de pods du front"
  type        = number
  default     = 2
}

variable "admin_password" {
  description = "Mot de passe admin du site (fourni via TF_VAR_admin_password)"
  type        = string
  sensitive   = true # jamais affiché dans les sorties de plan/apply
}