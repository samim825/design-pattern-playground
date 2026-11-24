/** Fill `{{name}}` placeholders in a caption/label: fill('Pay {{amount}}', { amount: '৳1,250' }). */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`)
}
