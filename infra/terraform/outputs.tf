output "namespace" {
  value = kubernetes_namespace_v1.portfolio.metadata[0].name
}

output "secret" {
  value = kubernetes_secret_v1.app.metadata[0].name
}
