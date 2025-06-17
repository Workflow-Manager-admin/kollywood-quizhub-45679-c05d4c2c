#!/bin/bash
cd /home/kavia/workspace/code-generation/kollywood-quizhub-45679-c05d4c2c/kollywood_quizhub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

