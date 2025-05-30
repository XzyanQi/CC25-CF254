#!/bin/bash
# Jalankan semua service paralel
npm run dev --prefix Backend &
npm run dev --prefix Frontend &
python3 main.py
