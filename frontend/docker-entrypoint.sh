#!/bin/sh

cat > /app/public/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  apiUrl: "${NEXT_PUBLIC_API_URL:-http://localhost:3000/api}"
};
EOF

# Start the Next.js server
exec node server.js
