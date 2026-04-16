import { getDb } from '../database';

export function getTemplates(userId: string, category?: string) {
  let query = `SELECT * FROM templates WHERE user_id = ?`;
  const params: unknown[] = [userId];
  if (category) { query += ` AND category = ?`; params.push(category); }
  query += ` ORDER BY usage_count DESC, name ASC`;
  return getDb().prepare(query).all(...params);
}

export function getTemplateById(userId: string, id: number) {
  return getDb().prepare(`SELECT * FROM templates WHERE user_id = ? AND id = ?`).get(userId, id);
}

export function createTemplate(data: {
  userId: string;
  name: string;
  category?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO templates (user_id, name, category, subject_template, body_template, variables)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.userId, data.name, data.category || null, data.subjectTemplate || null, data.bodyTemplate, data.variables);
  return db.prepare(`SELECT * FROM templates WHERE id = ?`).get(result.lastInsertRowid);
}

export function updateTemplate(userId: string, id: number, data: Record<string, unknown>) {
  const db = getDb();
  const allowed = {
    name: 'name', category: 'category', subjectTemplate: 'subject_template',
    bodyTemplate: 'body_template', variables: 'variables',
  };
  const sets: string[] = ['updated_at = unixepoch()'];
  const params: unknown[] = [];

  for (const [jsKey, col] of Object.entries(allowed)) {
    if (jsKey in data) { sets.push(`${col} = ?`); params.push(data[jsKey]); }
  }

  params.push(userId, id);
  db.prepare(`UPDATE templates SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`).run(...params);
  return db.prepare(`SELECT * FROM templates WHERE id = ?`).get(id);
}

export function deleteTemplate(userId: string, id: number) {
  getDb().prepare(`DELETE FROM templates WHERE user_id = ? AND id = ?`).run(userId, id);
}

export function incrementTemplateUsage(id: number) {
  getDb().prepare(`UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?`).run(id);
}

export function seedRestaurantTemplates(userId: string) {
  const db = getDb();
  const existing = db.prepare(`SELECT COUNT(*) as count FROM templates WHERE user_id = ?`).get(userId) as { count: number };
  if (existing.count > 0) return;

  const templates = [
    {
      name: 'Guest Complaint Apology',
      category: 'guest',
      subject: 'Re: Your Experience at Our Restaurant',
      body: `Dear {{guest_name}},\n\nThank you for taking the time to share your feedback with us. I sincerely apologise for {{issue_description}} — this is not the standard of experience we strive to provide.\n\nWe take all feedback seriously, and I want to assure you that we have {{resolution_offered}}.\n\nI would love the opportunity to welcome you back and ensure your next visit exceeds your expectations.\n\nKind regards`,
      vars: ['guest_name', 'issue_description', 'resolution_offered'],
    },
    {
      name: 'Reservation Confirmation',
      category: 'guest',
      subject: 'Reservation Confirmed — {{date}} at {{time}}',
      body: `Dear {{guest_name}},\n\nThank you for your reservation. I'm pleased to confirm your table for {{party_size}} guests on {{date}} at {{time}}.\n\nWe look forward to welcoming you. If you have any dietary requirements or special requests, please do not hesitate to let us know.\n\nKind regards`,
      vars: ['guest_name', 'date', 'time', 'party_size'],
    },
    {
      name: 'Reservation Cancellation',
      category: 'guest',
      subject: 'Re: Your Reservation',
      body: `Dear {{guest_name}},\n\nThank you for letting us know. We have cancelled your reservation as requested{{reason}}.\n\nWe hope to see you on another occasion and would be delighted to assist with a future booking.\n\nKind regards`,
      vars: ['guest_name', 'reason'],
    },
    {
      name: 'Positive Guest Review Response',
      category: 'guest',
      subject: 'Thank You for Your Wonderful Review',
      body: `Dear {{guest_name}},\n\nThank you so much for your kind words — we are thrilled that {{specific_compliment}}.\n\nOur team works hard to create memorable experiences, and feedback like yours means the world to us. We hope to welcome you back very soon.\n\nWith gratitude`,
      vars: ['guest_name', 'specific_compliment'],
    },
    {
      name: 'Negative Guest Review Response',
      category: 'guest',
      subject: 'Re: Your Recent Visit',
      body: `Dear {{guest_name}},\n\nThank you for bringing this to our attention. I fully {{acknowledgement}} and want to sincerely apologise.\n\nWe have {{action_taken}} to ensure this does not happen again. Your experience matters to us greatly, and I would welcome the opportunity to speak with you directly.\n\nKind regards`,
      vars: ['guest_name', 'acknowledgement', 'action_taken'],
    },
    {
      name: 'Supplier Order Confirmation',
      category: 'supplier',
      subject: 'Order Confirmation — {{delivery_date}}',
      body: `Hi {{supplier_name}},\n\nPlease treat this as confirmation of our order for {{order_items}}, for delivery on {{delivery_date}}.\n\nCould you please confirm receipt of this order and provide a reference number?\n\nThanks`,
      vars: ['supplier_name', 'order_items', 'delivery_date'],
    },
    {
      name: 'Supplier Delivery Issue',
      category: 'supplier',
      subject: 'Delivery Issue — Urgent',
      body: `Hi {{supplier_name}},\n\nI'm writing regarding {{issue}} with our most recent delivery.\n\nCould you please advise on {{resolution_request}} at your earliest convenience? This is affecting our service.\n\nThanks`,
      vars: ['supplier_name', 'issue', 'resolution_request'],
    },
    {
      name: 'Staff Shift Change Approval',
      category: 'staff',
      subject: 'Shift Change Approved',
      body: `Hi {{staff_name}},\n\nI'm happy to approve your shift change from {{original_shift}} to {{new_shift}}.\n\nPlease ensure you have cover arranged and inform the team. Let me know if you need anything else.\n\nThanks`,
      vars: ['staff_name', 'original_shift', 'new_shift'],
    },
    {
      name: 'Staff Shift Change Denial',
      category: 'staff',
      subject: 'Re: Shift Change Request',
      body: `Hi {{staff_name}},\n\nThank you for your request. Unfortunately, I'm unable to approve the shift change at this time due to {{reason}}.\n\nPlease speak to me directly if you'd like to discuss further.\n\nThanks`,
      vars: ['staff_name', 'reason'],
    },
    {
      name: 'Event Inquiry Response',
      category: 'guest',
      subject: 'Re: Private Event Enquiry',
      body: `Dear {{guest_name}},\n\nThank you for considering us for your {{event_type}}. We would be delighted to host you.\n\nWe can accommodate up to {{capacity}} guests and our packages start from {{pricing}}. I would love to arrange a call or site visit to discuss your requirements in more detail.\n\nKind regards`,
      vars: ['guest_name', 'event_type', 'capacity', 'pricing'],
    },
    {
      name: 'Health Inspection Follow-Up',
      category: 'admin_ops',
      subject: 'Re: Inspection — Corrective Actions',
      body: `Dear {{inspector_name}},\n\nThank you for your recent inspection. Following your findings regarding {{findings}}, I am pleased to confirm we have implemented the following corrective actions:\n\n{{corrective_actions}}\n\nPlease do not hesitate to contact me should you require any further information.\n\nKind regards`,
      vars: ['inspector_name', 'findings', 'corrective_actions'],
    },
    {
      name: 'Press / Media Inquiry',
      category: 'admin_ops',
      subject: 'Re: Media Enquiry',
      body: `Dear {{journalist_name}},\n\nThank you for reaching out from {{publication}}. We would be happy to assist with your enquiry.\n\nCould you provide further details on your deadline and the specific information you require? I will ensure you have everything you need.\n\nKind regards`,
      vars: ['journalist_name', 'publication'],
    },
    {
      name: 'VIP Guest Welcome',
      category: 'guest',
      subject: 'Welcome — We Look Forward to Your Visit',
      body: `Dear {{guest_name}},\n\nWe are delighted to welcome you on your upcoming visit. We have arranged {{special_arrangements}} to ensure your experience is exceptional.\n\nPlease feel free to contact me personally should there be anything else we can do.\n\nWith warm regards`,
      vars: ['guest_name', 'special_arrangements'],
    },
    {
      name: 'Maintenance Request to Landlord',
      category: 'admin_ops',
      subject: 'Urgent Maintenance Request',
      body: `Dear Sir/Madam,\n\nI am writing to report a maintenance issue that requires your urgent attention: {{issue_description}}.\n\nThis issue is rated {{urgency}} and is affecting our day-to-day operations. Could you please confirm receipt of this request and advise on an expected resolution timeline?\n\nKind regards`,
      vars: ['issue_description', 'urgency'],
    },
    {
      name: 'Allergen / Dietary Inquiry Response',
      category: 'guest',
      subject: 'Re: Dietary Requirements',
      body: `Dear {{guest_name}},\n\nThank you for contacting us regarding your dietary requirements. We take all allergen queries with the utmost seriousness.\n\nOur kitchen team is fully trained in allergen management, and our Head Chef will ensure your meal is prepared safely. Could you please confirm your specific requirements so we can prepare accordingly?\n\nKind regards`,
      vars: ['guest_name'],
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO templates (user_id, name, category, subject_template, body_template, variables)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const t of templates) {
    stmt.run(userId, t.name, t.category, t.subject, t.body, JSON.stringify(t.vars));
  }
}
