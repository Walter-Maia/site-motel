"""Gera o plugin do WordPress com o site: dist/

Uso (na pasta do projeto):  python wordpress/gerar-plugin.py

Saídas em dist/ (fora do git):
  montblack-site.zip          plugin leve: site + CSS + JS (as fotos e os filmes vão para a Biblioteca de Mídia)
  midia-wordpress/            as fotos e os filmes com nomes planos (mexicana-01.webp, mexicana-filme.mp4 …),
                              prontos para enviar em Mídia › Adicionar nova
  montblack-site-completo.zip plugin com as mídias dentro (assets/media), se preferir enviar um arquivo só

Para atualizar o site no WordPress: gere de novo e envie o montblack-site.zip em
Plugins › Adicionar novo › Enviar plugin (substituindo o atual). Mídia nova: envie só os arquivos novos.
"""
import os
import shutil
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RAIZ, "dist")
PLUGIN = "montblack-site"


def arquivos_do_site(com_midia):
    lista = [
        (os.path.join(RAIZ, "index.html"), "site.html"),
        (os.path.join(RAIZ, "wordpress", "montblack-site.php"), "montblack-site.php"),
    ]
    for pasta in ("css", "js") + (("media",) if com_midia else ()):
        for d, _, nomes in os.walk(os.path.join(RAIZ, "assets", pasta)):
            for n in nomes:
                p = os.path.join(d, n)
                lista.append((p, os.path.relpath(p, RAIZ).replace(os.sep, "/")))
    return lista


def zipa(nome, lista):
    saida = os.path.join(DIST, nome)
    with zipfile.ZipFile(saida, "w", zipfile.ZIP_DEFLATED) as z:
        for origem, destino in lista:
            z.write(origem, f"{PLUGIN}/{destino}")
    print(f"{saida}  ({len(lista)} arquivos, {os.path.getsize(saida) / 1048576:.1f} MB)")


os.makedirs(DIST, exist_ok=True)
zipa("montblack-site.zip", arquivos_do_site(False))
zipa("montblack-site-completo.zip", arquivos_do_site(True))

# mídias com nome plano: assets/media/<suite>/01.webp → midia-wordpress/<suite>-01.webp
midia = os.path.join(DIST, "midia-wordpress")
os.makedirs(midia, exist_ok=True)
for n in os.listdir(midia):   # esvazia a pasta (ela pode estar aberta no Explorer)
    os.remove(os.path.join(midia, n))
total = 0
for suite in sorted(os.listdir(os.path.join(RAIZ, "assets", "media"))):
    pasta = os.path.join(RAIZ, "assets", "media", suite)
    for n in sorted(os.listdir(pasta)):
        shutil.copy2(os.path.join(pasta, n), os.path.join(midia, f"{suite}-{n}"))
        total += 1
print(f"{midia}  ({total} arquivos)")
