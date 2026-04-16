import https from 'https';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function graphRequest<T>(accessToken: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(GRAPH_BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Graph API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(data ? JSON.parse(data) : ({} as T));
        } catch {
          reject(new Error('Failed to parse Graph API response'));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

export interface GraphMessage {
  id: string;
  internetMessageId?: string;
  conversationId?: string;
  from?: { emailAddress: { address: string; name?: string } };
  toRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType: string; content: string };
  folder?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  receivedDateTime?: string;
  sentDateTime?: string;
  importance?: string;
  categories?: string[];
}

export async function listMessages(
  accessToken: string,
  folder = 'inbox',
  deltaLink?: string,
  top = 50
): Promise<{ messages: GraphMessage[]; deltaLink?: string }> {
  let path: string;

  const folderMap: Record<string, string> = {
    inbox: 'inbox',
    sent: 'sentItems',
    drafts: 'drafts',
    deleted: 'deletedItems',
  };

  const graphFolder = folderMap[folder] || folder;

  if (deltaLink) {
    const url = new URL(deltaLink);
    path = url.pathname + url.search;
  } else {
    const select = 'id,internetMessageId,conversationId,from,toRecipients,subject,bodyPreview,isRead,hasAttachments,receivedDateTime,sentDateTime,importance,categories';
    path = `/me/mailFolders/${graphFolder}/messages/delta?$top=${top}&$select=${select}&$orderby=receivedDateTime desc`;
  }

  const response = await graphRequest<{
    value: GraphMessage[];
    '@odata.deltaLink'?: string;
    '@odata.nextLink'?: string;
  }>(accessToken, path);

  return {
    messages: response.value || [],
    deltaLink: response['@odata.deltaLink'],
  };
}

export async function getMessage(accessToken: string, messageId: string): Promise<GraphMessage> {
  return graphRequest<GraphMessage>(
    accessToken,
    `/me/messages/${messageId}?$select=id,internetMessageId,conversationId,from,toRecipients,subject,body,bodyPreview,isRead,hasAttachments,receivedDateTime,sentDateTime,importance,categories`
  );
}

export async function sendMail(
  accessToken: string,
  data: { to: string[]; subject: string; body: string; isHtml?: boolean }
) {
  return graphRequest(accessToken, '/me/sendMail', 'POST', {
    message: {
      subject: data.subject,
      body: { contentType: data.isHtml ? 'HTML' : 'Text', content: data.body },
      toRecipients: data.to.map((addr) => ({ emailAddress: { address: addr } })),
    },
    saveToSentItems: true,
  });
}

export async function replyToMessage(
  accessToken: string,
  messageId: string,
  body: string,
  isHtml = true
) {
  return graphRequest(accessToken, `/me/messages/${messageId}/reply`, 'POST', {
    message: { body: { contentType: isHtml ? 'HTML' : 'Text', content: body } },
    comment: '',
  });
}

export async function forwardMessage(
  accessToken: string,
  messageId: string,
  to: string[],
  comment = ''
) {
  return graphRequest(accessToken, `/me/messages/${messageId}/forward`, 'POST', {
    toRecipients: to.map((addr) => ({ emailAddress: { address: addr } })),
    comment,
  });
}

export async function markMessageRead(accessToken: string, messageId: string, isRead: boolean) {
  return graphRequest(accessToken, `/me/messages/${messageId}`, 'PATCH', { isRead });
}

export async function deleteMessage(accessToken: string, messageId: string) {
  return graphRequest(accessToken, `/me/messages/${messageId}/move`, 'POST', {
    destinationId: 'deleteditems',
  });
}

export async function getCalendarEvents(
  accessToken: string,
  from: string,
  to: string
): Promise<Array<{ id: string; subject: string; start: { dateTime: string }; end: { dateTime: string }; location?: { displayName: string }; isOnlineMeeting?: boolean; attendees?: Array<{ emailAddress: { address: string } }> }>> {
  const response = await graphRequest<{ value: unknown[] }>(
    accessToken,
    `/me/calendarView?startDateTime=${from}&endDateTime=${to}&$select=id,subject,start,end,location,isOnlineMeeting,attendees&$top=20`
  );
  return response.value as ReturnType<typeof getCalendarEvents> extends Promise<infer R> ? R : never;
}

export async function createCalendarEvent(
  accessToken: string,
  data: {
    subject: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
  }
) {
  return graphRequest(accessToken, '/me/events', 'POST', {
    subject: data.subject,
    start: { dateTime: data.start, timeZone: 'UTC' },
    end: { dateTime: data.end, timeZone: 'UTC' },
    location: data.location ? { displayName: data.location } : undefined,
    attendees: data.attendees?.map((addr) => ({
      emailAddress: { address: addr },
      type: 'required',
    })),
  });
}

export async function getSentEmailsToContact(
  accessToken: string,
  contactEmail: string,
  top = 25
): Promise<GraphMessage[]> {
  const filter = encodeURIComponent(`toRecipients/any(r:r/emailAddress/address eq '${contactEmail}')`);
  const select = 'id,subject,body,sentDateTime,toRecipients';
  const response = await graphRequest<{ value: GraphMessage[] }>(
    accessToken,
    `/me/mailFolders/sentItems/messages?$filter=${filter}&$top=${top}&$select=${select}`
  );
  return response.value || [];
}
