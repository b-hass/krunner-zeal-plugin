#!/bin/bash

# Exit if something fails
set -e

yarn install
yarn build

sudo systemctl stop krunner-zeal

sudo cp -v bin/* /usr/lib/qt/plugins/krunner-zeal-standalone
sudo chmod +x /usr/lib/qt/plugins/krunner-zeal-standalone/krunner-zeal-standalone.run
sudo cp -v plasma-runner-krunner-zeal.desktop /usr/share/kservices5/
sudo sed -e "s|\${DBUS_SESSION_BUS_ADDRESS}|$DBUS_SESSION_BUS_ADDRESS|" -e "s|\${USER}|$USER|" krunner-zeal.service | sudo tee /lib/systemd/system/krunner-zeal.service

sudo systemctl daemon-reload
sudo systemctl start krunner-zeal
sudo systemctl enable krunner-zeal

kquitapp5 krunner
