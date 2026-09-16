#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/assets/env.js
(function(window) {
  window.__env = window.__env || {};
  window.__env.dashboardUrl = '${DASHBOARD_URL:-http://localhost:4200/dashboard}';
})(this);
EOF