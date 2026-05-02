export type GithubUsernameValidationResult =
  | { ok: true; username: string }
  | { ok: false; message: string };

export function validateGithubUsername(value: string | null): GithubUsernameValidationResult {
  if (value === null || value.length === 0) {
    return { ok: false, message: "GitHub username is required." };
  }

  if (value.length > 39) {
    return { ok: false, message: "GitHub username must be 39 characters or fewer." };
  }

  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    return { ok: false, message: "GitHub username may only contain letters, numbers, and hyphens." };
  }

  if (!/^[A-Za-z0-9]/.test(value) || !/[A-Za-z0-9]$/.test(value)) {
    return { ok: false, message: "GitHub username must start and end with a letter or number." };
  }

  if (value.includes("--")) {
    return { ok: false, message: "GitHub username cannot contain consecutive hyphens." };
  }

  return { ok: true, username: value };
}
