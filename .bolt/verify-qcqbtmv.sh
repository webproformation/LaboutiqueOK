#!/bin/bash
echo "✅ Vérification qcqbtmv"
grep -q "qcqbtmvbvipsxwjlgjvk" .env || exit 1
exit 0
