function setupElectron() {
    window.electron = {self: require('electron')};
    window.electron.remote = window.electron.self.remote;
    window.electron.dialog = window.electron.self.remote.dialog;
    window.electron.Menu = window.electron.self.remote.Menu;
    window.electron.MenuItem = window.electron.self.remote.MenuItem;
    window.electron.app = window.electron.remote.app;

    function MenuClicked(eventName) {
        return function () {
            angular.element($('html')).scope().$broadcast('MenuEvent', eventName);
        }
    }

    window.menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: MenuClicked('new')
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+O',
                    click: MenuClicked('open')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: MenuClicked('save')
                },
                {
                    label: 'Save As',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: MenuClicked('save_as')
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: MenuClicked('close')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Print',
                    accelerator: 'CmdOrCtrl+P',
                    click: MenuClicked('print')
                },
                {
                    label: 'Export',
                    submenu: [
                        {
                            label: 'As PDF (Local)',
                            click: MenuClicked('export_pdf')
                        },
                        {
                            label: 'As PDF (Web Service)',
                            click: MenuClicked('export_pdf_web')
                        }
                        // {
                        //     label: 'As HTML',
                        //     click: MenuClicked('export_html')
                        // }
                    ]
                },
                {
                    type: 'separator'
                },
                {
                    recentFiles: true,
                    label: 'Recent Files',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Exit',
                    click: MenuClicked('exit')
                }]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    click: MenuClicked('undo')
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    click: MenuClicked('redo')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                },
                {
                    type: 'separator'
                },
                {
                    vimMode: true,
                    type: 'checkbox',
                    label: 'Vim Mode',
                    click: MenuClicked('toggle_vim')
                }
            ]
        },
        {
            label: "View",
            submenu: [

                {
                    wordWrap: true,
                    type: 'checkbox',
                    label: "Word Wrap",
                    checked: true,
                    click: MenuClicked('toggle_word_wrap')
                },
                {
                    lineNo: true,
                    type: 'checkbox',
                    label: "Display Line Numbers",
                    checked: true,
                    click: MenuClicked('toggle_line_no')
                },
                {
                    scrollSync: true,
                    type: 'checkbox',
                    label: "Scroll Sync",
                    checked: true,
                    click: MenuClicked('toggle_scroll_sync')
                },
                {
                    type: 'separator'
                },
                {
                    checked: false,
                    presentationMode: true,
                    type: 'checkbox',
                    label: "Presentation Mode",
                    accelerator: 'F11',
                    click: MenuClicked('presentation_mode')
                },
            ]
        }];

    window.electron.Menu.setApplicationMenu(window.electron.Menu.buildFromTemplate(window.menuTemplate));
}