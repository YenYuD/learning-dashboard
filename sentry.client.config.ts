import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    // 過濾 PII 欄位
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      delete data.password;
      delete data.token;
      // email 保留（用於 debug），但可依需求刪除
    }
    return event;
  },
});
