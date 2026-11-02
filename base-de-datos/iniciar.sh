#!/bin/bash
set -euo pipefail
SERVIDOR="${SQL_SERVIDOR:-sqlserver}"
SEMILLA="${SEMILLA_DATOS:-0}"
export SQLCMDPASSWORD="${SQL_CONTRASENA_SA}"
CMD=(/opt/mssql-tools18/bin/sqlcmd -C -I -f 65001 -S "$SERVIDOR" -U sa -b -v "ContrasenaApp=${SQL_CONTRASENA_APP}")
for script in /scripts/*.sql; do
  base="$(basename "$script")"
  if [[ "$base" == 011_semilla.sql ]]; then
    if [[ "$SEMILLA" != "1" && "$SEMILLA" != "true" ]]; then
      echo "Omitiendo ${script} (SEMILLA_DATOS=${SEMILLA})"
      continue
    fi
  fi
  echo "Aplicando ${script}"
  "${CMD[@]}" -i "$script"
done
echo "Scripts aplicados"
