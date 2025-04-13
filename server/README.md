
# Installation du Serveur Workflow

## Prérequis
- Système Linux (Debian/Ubuntu ou RedHat/CentOS)
- Accès root ou sudo
- PostgreSQL installé et configuré

## Installation

1. Copiez le dossier `server` dans `/opt/workflow-server`
2. Rendez le script d'installation exécutable :
```bash
chmod +x install.sh
```

3. Exécutez le script d'installation :
```bash
sudo ./install.sh
```

4. Vérifiez que le service est en cours d'exécution :
```bash
systemctl status workflow-server
```

Le serveur sera accessible sur le port 5000.
