#!/bin/bash

set -xe  # Enable debugging (print executed commands and exit on error)

# Informative message about file copy
echo "Copying file from S3 bucket..."

# Copy the file from S3 bucket (replace with your details)
aws s3 cp s3://secrets-bigulu/bigulu.env /var/www/httpdocs/api/.env

## Success message after copy
echo "File copied successfully."

# Start supervisor service
sudo systemctl start supervisor

# Success message after copy
echo "Sucessfully restart supervisor"
