'use strict';

const { shell, Menu } = require('electron');

const isMac = process.platform === 'darwin';

const helpMenu = {
  role: 'help',
  submenu: [
    {
      label: 'FAQ',
      click: async () => {
        await shell.openExternal('https://coinapp.zendesk.com/hc/en-us/sections/115000511287-FAQ');
      },
    },
  ],
};

const macAppMenu = { role: 'appMenu' };

const template = [
  ...(isMac ? [macAppMenu] : []),
  { role: 'fileMenu' },
  { role: 'editMenu' },
  {
    role: 'viewMenu',
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  { role: 'windowMenu' },
  helpMenu,
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
