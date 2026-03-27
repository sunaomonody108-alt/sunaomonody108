/**
 * OneDrive integration via Microsoft Graph API (app-only auth)
 *
 * Required env vars:
 *   MICROSOFT_TENANT_ID
 *   MICROSOFT_CLIENT_ID
 *   MICROSOFT_CLIENT_SECRET
 *   ONEDRIVE_USER_ID  (UPN or object ID of the target user)
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Microsoft Graph API credentials are not configured");
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * Save content to OneDrive at /journal/<filename>
 */
export async function saveToOneDriveJournal(
  filename: string,
  content: string
): Promise<void> {
  const userId = process.env.ONEDRIVE_USER_ID;
  if (!userId) {
    throw new Error("ONEDRIVE_USER_ID is not configured");
  }

  const token = await getAccessToken();

  // PUT /users/{userId}/drive/root:/journal/{filename}:/content
  const url = `${GRAPH_BASE}/users/${userId}/drive/root:/journal/${encodeURIComponent(filename)}:/content`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: content,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OneDrive upload failed (${res.status}): ${body}`);
  }
}
