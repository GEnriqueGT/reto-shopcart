#!/bin/bash
set -euo pipefail
SERVIDOR="${SQL_SERVIDOR:-sqlserver}"
export SQLCMDPASSWORD="${SQL_CONTRASENA_SA}"
CMD=(/opt/mssql-tools18/bin/sqlcmd -C -f 65001 -S "$SERVIDOR" -U sa -b -v "ContrasenaApp=${SQL_CONTRASENA_APP}")
for script in /scripts/*.sql; do
  echo "Aplicando ${script}"
  "${CMD[@]}" -i "$script"
done
echo "Scripts aplicados"
