output "site_url" {
  value = "http://localhost:8088"
}

output "release" {
  value = "${helm_release.portfolio.name} (rev. ${helm_release.portfolio.metadata.revision}, images ${var.image_tag})"
}