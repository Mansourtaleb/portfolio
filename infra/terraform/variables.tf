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



variable "admin_password" {
  description = "Mot de passe admin du site (fourni via TF_VAR_admin_password)"
  type        = string
  sensitive   = true # jamais affiché dans les sorties de plan/apply
}