#!/bin/bash

for file in $(find ./src/pdf/controllers -name "*.ts"); do
  echo "Updating $file"
  sed -i '' 's|from '\''../services/pdf.service'\''|from '\''../pdf.service'\''|g' $file
done
