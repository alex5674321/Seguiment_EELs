# Seguiment EEL · Diari de pràctiques

Diari públic en català per a GitHub Pages, amb disseny fosc en negre, gris, blanc i verd. Sense instal·lacions ni dependències externes.

## Publicar o actualitzar

Copia `index.html`, `style.css` i `app.js` a l’arrel del repositori. Conserva la carpeta `data` amb el teu `diary.json`: conté totes les activitats, tasques i notes. L’actualització visual no requereix canviar aquest fitxer.

A GitHub, ves a **Settings → Pages → Build and deployment**. Tria **Deploy from a branch**, branca **main** i carpeta **/ (root)**, i prem **Save**.

Adreça: https://alex5674321.github.io/Seguiment_EELs/

## Desenvolupament local

Des de l’arrel del repositori, executa `python3 -m http.server 8000 --bind 127.0.0.1`. No cal instal·lar dependències. El fitxer `data/diary.json` inicial és buit; si tens un diari anterior, conserva’l abans de publicar. La lectura local intenta primer GitHub i, si falla, utilitza aquest fitxer. Els canvis del mode d’edició es desen al repositori real.

## Apartats

- **Resum:** hores d’avui, de la setmana i totals; fitxa de la setmana actual amb activitats, tasques treballades, dies amb activitat i gràfic diari; temps acumulat per tasca.
- **Calendari:** vista compacta a l’esquerra, amb dia, setmana i mes; llista vertical dels propers esdeveniments a la dreta. En pantalles petites, la llista apareix a sota.
- **Seguiment:** una targeta per cada setmana amb activitats, més la setmana actual. Cada fitxa mostra les descripcions, les tasques i el temps registrat. Les setmanes van de dilluns a diumenge.
- **Tasques:** targetes amb títol, descripció, activitats i temps. També admet subtasques.
- **Manteniment:** l’antic HouseKeeping. Notes que pots editar, ratllar, recuperar o eliminar.

Les fitxes setmanals es calculen automàticament a partir del calendari. No cal introduir el mateix contingut dues vegades. Les activitats amb hora d’inici futura es mostren com a planificades i no se sumen al temps treballat del resum ni de les fitxes. Quan arriba l’hora d’inici, passen a comptar com a registrades; no hi ha verificació manual de finalització. Recarrega la pàgina per actualitzar aquest càlcul si l’has deixada oberta.

El temps s’introdueix manualment en minuts. Cada activitat es compta en la data indicada, encara que acabi després de mitjanit. El calendari i les targetes de tasques mostren la durada de totes les activitats associades, incloses les previstes; el resum i el seguiment separen les futures. Les hores de cada tasca corresponen a les seves activitats directes.

## Editar i desar

1. A GitHub, ves a **Settings del compte → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. A **Resource owner**, selecciona `alex5674321`. A **Repository access**, tria **Only select repositories → Seguiment_EELs**.
3. A **Repository permissions**, activa **Contents: Read and write** i defineix la caducitat.
4. A la pàgina, prem **Mode d’edició**, introdueix el token i prem **Entrar**.

No comparteixis el token ni l’afegeixis al repositori. Només es conserva en memòria, fins que recarreguis, tanquis la pàgina o surtis del mode d’edició. No es desa al diari ni al navegador.

Els formularis es desen quan prems **Desar**; marcar o desmarcar una nota es desa immediatament. Espera el missatge **Desat a GitHub ✓**. Si falla la connexió o els permisos, es mostra l’error i el canvi no es considera desat. No es pot editar sense connexió.

El contingut es desa a `data/diary.json`, a la branca `main`, amb historial de versions a GitHub. Si un altre dispositiu ha desat canvis, l’editor carrega la versió actual i et demana que repeteixis el canvi, per evitar sobreescriure-la. Eliminar un element no elimina les seves versions antigues de l’historial.

La lectura és pública. Els visitants obtenen el contingut actual des de GitHub; si l’API falla, s’intenta carregar la còpia publicada a Pages, que pot portar uns minuts de retard. Cal recarregar la pàgina per veure canvis recents.

La interfície és en català. Els títols, les notes i les descripcions que ja hagis escrit es conserven tal com els vas introduir.

## Gestionar tasques i fitxes setmanals

En **Mode d’edició**, a **Tasques** pots crear, editar i eliminar targetes. També pots eliminar la tasca des del seu detall. Abans d’eliminar es demana confirmació: les activitats es conserven sense tasca i les subtasques passen al nivell principal.

Arrossega la nansa **⠿ Arrossegar** sobre una altra targeta per canviar l’ordre. Els botons **↑ / ↓** permeten fer el mateix amb teclat o mòbil. L’ordre es desa a GitHub i també s’aplica al menú lateral. Per canviar la tasca pare d’una subtasca, fes servir **Editar → Dins de**.

A **Seguiment**, prem **Editar fitxa** per escriure el títol i el resum del que has fet aquella setmana. **+ Fitxa setmanal** permet triar una setmana, encara que no tingui activitats. Les notes setmanals es desen al camp opcional `weeks` de `data/diary.json`, compatible amb els diaris anteriors. Les hores continuen calculant-se a partir de les activitats, que pots afegir o editar des de la fitxa. Canviar la setmana de la nota no mou les activitats del calendari.
