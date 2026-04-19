import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      Object.keys(data).forEach(key => {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          delete data[key];
        }
      });
    }
    return event;
  },
});
