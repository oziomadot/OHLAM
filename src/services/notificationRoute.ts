/** Only allow app screens, never URLs or API actions supplied in a payload. */
export function notificationRoute(data: Record<string, unknown>): string {
  const conversationId = String(data.conversation_id ?? "");
  if ((data.type ?? data.notification_type) === "chat_message" && /^\d+$/.test(conversationId)) {
    return `/(tabs)/chat/${conversationId}`;
  }
  const route = typeof data.route === "string" ? data.route.replace(/^\/\(tabs\)/, "") : "";
  if (/^\/(?:appointment\/\d+|appointment\/inspection\/\d+|appointment\/representative\/view\?appointmentId=\d+|property-payment\/transaction\/\d+|property-payment\/\d+|property-payment\/lister\/add-beneficiary\?appointmentId=\d+|wallet(?:\/referral-rewards|\/transactions)?|appointment\/lister\/create|property\/[a-zA-Z0-9-]+)$/.test(route)) {
    return `/(tabs)${route}`;
  }
  return "/(tabs)/dashboard/notifications";
}
