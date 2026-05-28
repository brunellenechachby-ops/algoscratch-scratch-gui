# AlgoScratch Scratch GUI

Version personnalisée de Scratch GUI pour AlgoScratch.

Ajouts principaux :

- mode guidé activé par URL pour les premières activités :
  - `?activity=activite-1&mode=simple`
  - `?activity=activite-2&mode=simple`
  - `?activity=activite-3&mode=simple`
- mode complet avec `mode=full` ;
- toolbox simplifiée selon l’activité ;
- chargement automatique de l’extension Stylo en mode guidé.

Exemple local :

```text
http://localhost:8601/?activity=activite-1&mode=simple
http://localhost:8601/?activity=activite-1&mode=full
```

Ce dépôt reste basé sur Scratch GUI, sous licence AGPL-3.0.