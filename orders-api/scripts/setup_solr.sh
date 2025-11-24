#!/bin/bash

# Script para configurar el schema de Solr para orders
SOLR_URL="http://localhost:8983/solr"
CORE_NAME="orders"

echo "Configurando schema para el core $CORE_NAME..."

# Agregar campos al schema
curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "negocio_id",
    "type": "string",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "sucursal_id",
    "type": "text_general",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "usuario_id",
    "type": "string",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "mesa",
    "type": "text_general",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "estado",
    "type": "text_general",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "total",
    "type": "pdouble",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "observaciones",
    "type": "text_general",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "producto_ids",
    "type": "strings",
    "stored": true,
    "indexed": true,
    "multiValued": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "producto_names",
    "type": "text_general",
    "stored": true,
    "indexed": true,
    "multiValued": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "created_at",
    "type": "pdate",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": {
    "name": "updated_at",
    "type": "pdate",
    "stored": true,
    "indexed": true
  }
}' "$SOLR_URL/$CORE_NAME/schema"

echo ""
echo "Schema configurado correctamente!"
echo "Ahora necesitas reindexar las ordenes existentes."