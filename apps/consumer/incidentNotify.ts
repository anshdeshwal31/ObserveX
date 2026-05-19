type IncidentNotificationPayload = {
  incidentId: string;
  websiteId: string;
  websiteUrl: string;
  severity: "Info" | "Warning" | "Critical";
  title: string;
  reason: string;
};

function mapPagerDutySeverity(severity: IncidentNotificationPayload["severity"]) {
  if (severity === "Critical") return "critical";
  if (severity === "Warning") return "warning";
  return "info";
}

async function postJson(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webhook failed: ${response.status} ${text.slice(0, 200)}`);
  }
}

export async function notifyIncidentOpened(payload: IncidentNotificationPayload) {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const pagerDutyKey = process.env.PAGERDUTY_ROUTING_KEY;
  const pagerDutySource = process.env.PAGERDUTY_SOURCE || "pingnova";

  if (slackUrl) {
    const slackBody = {
      text: `Incident opened: ${payload.websiteUrl}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Incident Opened*\n*Endpoint:* ${payload.websiteUrl}\n*Severity:* ${payload.severity}\n*Reason:* ${payload.reason}`,
          },
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `Incident ID: ${payload.incidentId}` },
            { type: "mrkdwn", text: `Website ID: ${payload.websiteId}` },
          ],
        },
      ],
    };
    try {
      await postJson(slackUrl, slackBody);
    } catch (err) {
      console.error("[notifyIncidentOpened][slack]", err);
    }
  }

  if (pagerDutyKey) {
    const pdBody = {
      routing_key: pagerDutyKey,
      event_action: "trigger",
      dedup_key: payload.incidentId,
      payload: {
        summary: payload.title,
        severity: mapPagerDutySeverity(payload.severity),
        source: pagerDutySource,
        component: "pingNova",
        group: "uptime",
        class: "incident",
        custom_details: {
          website_id: payload.websiteId,
          website_url: payload.websiteUrl,
          incident_id: payload.incidentId,
          reason: payload.reason,
        },
      },
    };
    try {
      await postJson("https://events.pagerduty.com/v2/enqueue", pdBody);
    } catch (err) {
      console.error("[notifyIncidentOpened][pagerduty]", err);
    }
  }
}

export async function notifyIncidentResolved(payload: IncidentNotificationPayload) {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const pagerDutyKey = process.env.PAGERDUTY_ROUTING_KEY;
  const pagerDutySource = process.env.PAGERDUTY_SOURCE || "pingnova";

  if (slackUrl) {
    const slackBody = {
      text: `Incident resolved: ${payload.websiteUrl}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Incident Resolved*\n*Endpoint:* ${payload.websiteUrl}\n*Severity:* ${payload.severity}\n*Reason:* ${payload.reason}`,
          },
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `Incident ID: ${payload.incidentId}` },
            { type: "mrkdwn", text: `Website ID: ${payload.websiteId}` },
          ],
        },
      ],
    };
    try {
      await postJson(slackUrl, slackBody);
    } catch (err) {
      console.error("[notifyIncidentResolved][slack]", err);
    }
  }

  if (pagerDutyKey) {
    const pdBody = {
      routing_key: pagerDutyKey,
      event_action: "resolve",
      dedup_key: payload.incidentId,
      payload: {
        summary: payload.title,
        severity: mapPagerDutySeverity(payload.severity),
        source: pagerDutySource,
      },
    };
    try {
      await postJson("https://events.pagerduty.com/v2/enqueue", pdBody);
    } catch (err) {
      console.error("[notifyIncidentResolved][pagerduty]", err);
    }
  }
}
