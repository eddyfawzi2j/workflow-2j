
#!/bin/bash

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js..."
    # Pour Debian/Ubuntu
    if command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    # Pour RedHat/CentOS
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "Système non supporté"
        exit 1
    fi
fi

# Installer les dépendances
npm install

# Créer les répertoires nécessaires
mkdir -p uploads
mkdir -p dist

# Build du projet
npm run build

# Créer le service systemd
cat > /etc/systemd/system/workflow-server.service << EOF
[Unit]
Description=Workflow Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/workflow-server
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

# Recharger systemd et démarrer le service
systemctl daemon-reload
systemctl enable workflow-server
systemctl start workflow-server

echo "Installation terminée. Le serveur est configuré et démarré."
