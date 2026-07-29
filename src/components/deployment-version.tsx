const repositoryUrl = "https://github.com/procesalab0-prog/Muromio/commit";

export function DeploymentVersion() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const shortSha = commitSha?.slice(0, 7) ?? "local";
  const label = `Versión ${shortSha}`;

  if (!commitSha) {
    return <span className="deployment-version">{label}</span>;
  }

  return (
    <a
      className="deployment-version"
      href={`${repositoryUrl}/${commitSha}`}
      target="_blank"
      rel="noreferrer"
      title={`Commit desplegado: ${commitSha}`}
    >
      {label}
    </a>
  );
}
