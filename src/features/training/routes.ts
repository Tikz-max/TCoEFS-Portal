export function buildTrainingStepHref(step: number, registrationId?: string | null) {
  const path = `/training/register/${step}`;
  if (!registrationId) return path;
  return `${path}?registration=${encodeURIComponent(registrationId)}`;
}

export function buildTrainingWorkspaceHref(
  basePath: string,
  registrationId?: string | null,
  extras?: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams();
  if (registrationId) params.set("registration", registrationId);
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
