'use strict';

const { app, shell } = require('electron');
const openWindow = require('./openWindow');
const { isDevelopment, isMac } = require('./constants');
const updater = require('./updater');

const updateMenu = {
  get label() {
    switch (updater.state) {
      case 'checking-for-update':
        return 'Checking for Updates';
      case 'update-available':
        return 'Updating...';
      case 'update-downloaded':
        return 'Restart to Update';
      default:
        return 'Check for Updates';
    }
  },
  get enabled() {
    return ['update-not-available', 'error'].includes(updater.state);
  },
  click() {
    if (updater.state === 'update-downloaded') {
      updater.quitAndInstall();
    } else {
      updater.checkForUpdates();
    }
  },
};

const helpMenu = {
  role: 'help',
  submenu: [
    {
      label: 'FAQ',
      click: async () => {
        await shell.openExternal('https://support.coin.space/hc/en-us/sections/115000511287-FAQ');
      },
    },
    {
      label: 'Support',
      click: async () => {
        await shell.openExternal('https://support.coin.space/hc/en-us');
      },
    },
    ...(!isMac ? [
      { type: 'separator' },
      {
        role: 'about',
        click: async () => {
          // TODO set icon
          await app.showAboutPanel();
        },
      },
      ...(updater.supported ? [updateMenu] : []),
    ] : []),
  ],
};

const appMenu = {
  get label() {
    return app.name;
  },
  submenu: [
    { role: 'about' },
    ...(updater.supported ? [updateMenu] : []),
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' },
  ],
};

const template = [
  ...(isMac ? [appMenu] : []),
  { role: 'fileMenu' },
  { role: 'editMenu' },
  // View submenu
  {
    role: 'viewMenu',
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        role: 'forcereload',
      },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      ...( isDevelopment ? [{
        role: 'toggledevtools',
      }] : []),
      { role: 'togglefullscreen' },
    ],
  },
  // Window submenu
  {
    role: 'windowMenu',
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        {
          label: app.name,
          click: () => {
            openWindow();
          },
          accelerator: 'CmdOrCtrl+O',
        },
        { type: 'separator' },
        { role: 'front' },
      ] : [
        { role: 'close' },
      ]),
    ],
  },
  helpMenu,
];

module.exports = template;
