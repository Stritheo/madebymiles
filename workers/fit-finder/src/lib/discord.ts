export async function postReport(
  webhookUrl: string,
  message: string,
): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: 'Fit Finder',
            description: message,
            color: 3066993, // green
          },
        ],
      }),
    });
  } catch {
    // Discord notification failure should not break the response
  }
}

export async function postAlert(
  webhookUrl: string,
  message: string,
): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: 'Fit Finder Alert',
            description: message,
            color: 15158332, // red
          },
        ],
      }),
    });
  } catch {
    // Discord notification failure should not break the response
  }
}
