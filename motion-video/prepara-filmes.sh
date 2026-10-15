#!/usr/bin/env bash
# Extrai dos filmes originais (HEVC 10 bits HLG do iPhone, 1080x1920) os trechos usados no vídeo,
# convertidos para SDR, em sequências JPG 1080x1920 a 30 fps: material/filmes/<id>/0001.jpg …
set -e
cd "$(dirname "$0")"
ORIG="../assets/Suites"
TONEMAP="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,eq=contrast=1.06:saturation=1.12:gamma=0.97,scale=1080:1920:flags=lanczos"

trecho () { # id arquivo inicio duracao
  local id="$1" arq="$2" ini="$3" dur="$4"
  mkdir -p "material/filmes/$id"
  rm -f "material/filmes/$id"/*.jpg
  ffmpeg -v error -y -ss "$ini" -i "$ORIG/$arq" -t "$dur" -vf "$TONEMAP,fps=30" -q:v 2 "material/filmes/$id/%04d.jpg"
  echo "$id: $(ls "material/filmes/$id" | wc -l) quadros"
}

trecho mexicana   "Mexicana/1. Vídeo"        0.4  2.6
trecho high-tech  "High tech/1. Vídeo"      12.0  1.6
trecho espanhola  "Espanhola/1. Vídeo"      14.6  1.6
trecho japonesa   "Japonesa/1. Vídeo_.mov"   1.0  1.8
trecho las-vegas  "Las Vegas/1. Vídeo"      11.2  1.6
