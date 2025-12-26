#!/bin/sh

cat > /app/public/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  apiUrl: "${NEXT_PUBLIC_API_URL}"
};
EOF

# Start the Next.js server
exec node server.js
