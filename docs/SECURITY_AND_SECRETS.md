# Security and Secrets

- Review all hook scripts before accepting Claude workspace trust.
- Never commit API keys, tokens, certificates, environment secrets or customer production data.
- Store local secrets in ignored `.env` or enterprise secret management.
- Hooks log metadata only; remove sensitive tool input logging if the repository begins handling secrets.
- MCP connections must be registered and approved; no MCP is a source of product truth.
- Direct main pushes, force pushes and destructive commands are blocked by the supplied guard, but human Git protection rules should also be enabled.
