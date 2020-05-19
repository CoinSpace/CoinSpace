'use strict';

const { app, shell } = require('electron');
const openWindow = require('./openWindow');
const { isDevelopment, isMac } = require('./constants');

const helpMenu = {
  role: 'help',
  submenu: [
    {
      label: 'FAQ',
      click: async () => {
        await shell.openExternal('https://coinapp.zendesk.com/hc/en-us/sections/115000511287-FAQ');
      },
    },
    {
      label: 'Support',
      click: async () => {
        await shell.openExternal('https://coinapp.zendesk.com/hc/en-us');
      },
    },
  ],
};

const macAppMenu = { role: 'appMenu' };

const template = [
  ...(isMac ? [macAppMenu] : []),
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
