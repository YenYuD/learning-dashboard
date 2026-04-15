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
      Object.keys(data).forEach(key => {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          delete data[key];
        }
      });
      // email 保留（用於 debug），但可依需求刪除
    }
    return event;
  },
});
