# Mini Todo (HTML / CSS / JS)

Cette petite application est écrite uniquement en HTML, CSS et JavaScript. Aucune dépendance ni Python requis.

Pour l'utiliser :

- Ouvrir [index.html](index.html) dans un navigateur moderne.
- (Optionnel) Pour un serveur local rapide :

```powershell
# depuis le dossier du projet
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

Les tâches sont sauvegardées dans le `localStorage` du navigateur.

Fonctionnalités supplémentaires :
- Suivi des dépenses (entrées / sorties) avec sauvegarde dans `localStorage`.
- Sommaire affichant entrées, sorties et solde.

Fonctionnalités ajoutées récemment :
- Suivi des projets : nom, caisse et montant par projet.
- Suivi des dettes par membre : on peut saisir `nom` et `rang` du membre et le montant dû.
- Les projets et dettes sont sauvegardés dans le `localStorage` du navigateur.

Simulation et critères d'acceptation :
- Vous pouvez simuler un projet en sélectionnant un projet, en saisissant les revenus projetés, les dépenses projetées et la durée.
- Le résultat affiche le solde projeté et le ROI estimé.
- Définissez des critères d'acceptation (financement minimal, solde minimal, ROI minimal, dette maximale par membre, caisse requise). Enregistrez-les et utilisez "Évaluer le projet" pour voir si le projet satisfait les conditions. Les raisons d'un éventuel refus sont listées.

Sanctions financières :
- Vous pouvez ajouter des sanctions financières pour un membre (nom, rang, montant, motif). Elles sont stockées dans `localStorage`.
- Les sanctions sont incluses dans le calcul des dettes totales par membre et seront prises en compte lors de l'évaluation des critères (par ex. `Dette max par membre`).

Export / Import JSON :
- Vous pouvez exporter toutes les données (tâches, dépenses, projets, dettes, sanctions, critères) via le bouton "Exporter JSON".
- L'import remplace les données actuelles (confirmation demandée). Utilisez le bouton "Importer JSON" et choisissez un fichier précédemment exporté.

Comportement des sanctions :
- Lorsqu'une sanction est ajoutée, une dette liée est automatiquement créée (même `nom`/`rang`/`montant`). La suppression d'une sanction supprime aussi la dette liée.

Export PDF des sanctions :
- Chaque sanction a maintenant un bouton `PDF` pour exporter la fiche de la sanction en PDF (via la fenêtre d'impression du navigateur).
- Il est aussi possible d'exporter toutes les sanctions en une seule page PDF via le bouton "Exporter sanctions (PDF)".

- Export complet PDF : le bouton "Exporter tout (PDF)" génère un rapport combiné contenant : tâches, dépenses, projets, dettes, sanctions, flux (journal), totaux par membre et critères enregistrés. Le navigateur ouvrira la boîte d'impression pour enregistrer en PDF.

Flux / journalisation :
- Toutes les actions importantes (ajout/suppression de tâche, dépense, projet, dette, sanction, export/import, purge) sont enregistrées dans le journal (section "Flux"). Chaque entrée contient la date et l'heure.
- Le journal est sauvegardé dans `localStorage` et inclus dans l'export JSON et dans le rapport PDF complet.

Recherche et filtrage du journal :
- Un champ de recherche dans la section "Flux" permet de filtrer les entrées du journal en temps réel. La recherche est insensible à la casse et couvre le contenu du message.

Personnalisation du PDF :
- Section "Paramètres PDF" : vous pouvez personnaliser le rapport PDF avec :
  - **Titre du rapport** : remplace le titre par défaut "Rapport mgs".
  - **URL du logo** : ajoute un logo en haut du rapport (lien HTTPS ou data URL).
  - **Sous-titre** (optionnel) : ajoute un sous-titre au rapport.
  - **Format** : choix entre A4 (défaut) ou Lettre (USA). Vous devez cliquer sur "Enregistrer paramètres" pour appliquer les paramètres à tous les prochains exports PDF.

