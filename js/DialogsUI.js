"use strict";

/**
 * Implements MDL dialogs like alert() and prompt()
 */
class DialogsUI {
  constructor() {
    let elementIds = [
      // Elements of the alert dialog
      'alert-dialog',
      'alert-dialog-title',
      'alert-dialog-text',
      'alert-dialog-okay',

      // Elements of the confirm dialog
      'confirm-dialog',
      'confirm-dialog-title',
      'confirm-dialog-text',
      'confirm-dialog-yes',
      'confirm-dialog-no',

      // Elements of the prompt dialog
      'prompt-dialog',
      'prompt-dialog-title',
      'prompt-dialog-text',
      'prompt-dialog-form',
      'prompt-dialog-input',
      'prompt-dialog-label',
      'prompt-dialog-error',
      'prompt-dialog-okay',
      'prompt-dialog-cancel',

      // Elements of the open dialog
      'open-dialog',
      'open-dialog-okay',
      'open-dialog-cancel',

      // Elements of the delete dialog
      'delete-dialog',
      'delete-dialog-okay',
      'delete-dialog-cancel',
    ];

    // Lookup all of the elements and store them as properties
    elementIds.forEach((id) => {
      this[id.replace(/-/g,'_')] = document.getElementById(id);
    });

    // If dialogs are not supported natively, register the dialogs
    if (!this.alert_dialog.showModal) {
      dialogPolyfill.registerDialog(this.alert_dialog);
      dialogPolyfill.registerDialog(this.confirm_dialog);
      dialogPolyfill.registerDialog(this.prompt_dialog);
      dialogPolyfill.registerDialog(this.open_dialog);
      dialogPolyfill.registerDialog(this.delete_dialog);
    }

    // A generic function for handling buttons in dialogs that
    // return a constant value.
    function buttonHandler(dialog, value=undefined) {
      dialog.close(value);
    }

    // A function for handling a return value from the prompt dialog.
    var promptDialogOkHandler = (e) => {
      e.preventDefault(); // Don't actually submit a form
      this.prompt_dialog.close(this.prompt_dialog_input.value);
    };

    // A function for handling the close event on a dialog by resolving
    // the promise associated with that invocation of the dialog.
    function closeHandler(dialog, remove_table) {
      if (remove_table) {
        dialog.querySelector('table').remove();
      }

      let resolve = dialog._resolver;
      if (resolve) {
        dialog._resolver = null;
        resolve(dialog.returnValue);
      }
    }

    // For the alert dialog okay button, we don't return any value
    this.alert_dialog_okay.addEventListener(
      'click', buttonHandler.bind(null, this.alert_dialog));

    // For the confirm dialog, the buttons return true or false
    this.confirm_dialog_yes.addEventListener(
      'click', buttonHandler.bind(null, this.confirm_dialog, true));
    this.confirm_dialog_no.addEventListener(
      'click', buttonHandler.bind(null, this.confirm_dialog, false));


    // For the prompt dialog, we return the user's input when the user
    // clicks okay or types Return (i.e. on the submit event)
    this.prompt_dialog_okay.addEventListener('click', promptDialogOkHandler);
    this.prompt_dialog_form.addEventListener('submit', promptDialogOkHandler);

    // For the cancel button of a prompt dialog, return null
    this.prompt_dialog_cancel.addEventListener(
      'click', buttonHandler.bind(null, this.prompt_dialog, null));

    // For the cancel button of an open dialog, return null
    this.open_dialog_cancel.addEventListener(
      'click', buttonHandler.bind(null, this.open_dialog, null));

    // For the open button, return whichever filename is selected
    this.open_dialog_okay.addEventListener('click', () => {
      let selected = this.open_dialog.querySelector('tr.is-selected');
      // There should always be a selected row; otherwise this button
      // ought to be disabled.
      if (selected) {
        this.open_dialog.close(selected.dataset.filename);
      }
    });

    this.open_dialog.addEventListener('click', e => {
      // Figure out what row was clicked on 
      let row = e.target.closest('tbody>tr');
      if (!row) { // If it was not a click on the table,
        return;   // ignore it.
      }

      // Once a file has been selected we can enable the Open button
      this.open_dialog_okay.disabled = false;

      // Remove any previous selection
      let lastSelected = this.open_dialog.querySelector('tbody>tr.is-selected');
      if (lastSelected) {
        lastSelected.classList.remove('is-selected');
      }

      // Highlight the new selection
      row.classList.add('is-selected');
    });

    this.open_dialog.addEventListener('dblclick', e => {
      let row = e.target.closest('tbody>tr');
      if (row) {
        let filename = row.dataset.filename;
        this.open_dialog.close(filename);
      }
    });

    this.delete_dialog.addEventListener('click', e => {
      // If this click was not inside a checkbox, then
      // we want to handle it here
      if (!e.target.closest('label.mdl-checkbox')) {
        // Figure out what row was clicked on
        let row = e.target.closest('tbody>tr');
        if (!row) { // If it was not a click on the table,
          return;   // ignore it.
        }

        // Find the <label> in that row. With MDL this behaves like the checkbox
        let label = row.querySelector('label');

        // Toggle the checkbox
        if (label.classList.contains('is-checked')) {
          label.MaterialCheckbox.uncheck();
        }
        else {
          label.MaterialCheckbox.check();
        }
      }
    });

    // The delete dialog is easier than the open dialog since the
    // table has select checkboxes and handles the selections automatically
    // For the cancel button of an open dialog, return null
    this.delete_dialog_cancel.addEventListener(
      'click', buttonHandler.bind(null, this.delete_dialog, null));

    // For the open button, return a (possibly empty) array of filenames
    this.delete_dialog_okay.addEventListener('click', () => {
      let checked = this.delete_dialog.querySelectorAll('label.mdl-checkbox.is-checked');
      let filenames = [];
      checked.forEach(box => filenames.push(box.closest('tr').dataset.filename));
      this.delete_dialog.close(filenames);
    });

    // All dialogs need a handler to resolve their promise when closed
    this.alert_dialog.addEventListener(
      'close', closeHandler.bind(null, this.alert_dialog, false));
    this.confirm_dialog.addEventListener(
      'close', closeHandler.bind(null, this.confirm_dialog, false));
    this.prompt_dialog.addEventListener(
      'close', closeHandler.bind(null, this.prompt_dialog, false));
    this.open_dialog.addEventListener(
      'close', closeHandler.bind(null, this.open_dialog, true));
    this.delete_dialog.addEventListener(
      'close', closeHandler.bind(null, this.delete_dialog, true));
  }

  alert(title, text) {
    return new Promise((resolve, reject) => {
      this.alert_dialog_title.textContent = title;
      this.alert_dialog_text.textContent = text;
      this.alert_dialog._resolver = resolve;
      this.alert_dialog.returnValue = undefined;
      this.alert_dialog.showModal();
    });
  }

  confirm(title, text, yesButtonText, noButtonText) {
    return new Promise((resolve, reject) => {
      this.confirm_dialog_title.textContent = title || '';
      this.confirm_dialog_text.textContent = text || '';
      this.confirm_dialog_yes.textContent = yesButtonText || 'Ok';
      this.confirm_dialog_no.textContent = noButtonText || 'Cancel';
      this.confirm_dialog._resolver = resolve;
      this.confirm_dialog.returnValue = false;
      this.confirm_dialog.showModal();
    });
  }

  prompt(title, text, label, pattern, errorMessage, buttonText) {
    return new Promise((resolve, reject) => {
      this.prompt_dialog_title.textContent = title || '';
      this.prompt_dialog_text.textContent = text || '';
      this.prompt_dialog_label.textContent = label || '';
      this.prompt_dialog_okay.textContent = buttonText || 'Ok';
      this.prompt_dialog_input.pattern = pattern || '';
      this.prompt_dialog_error.textContent = errorMessage || '';
      this.prompt_dialog_input.value = '';
      this.prompt_dialog._resolver = resolve;
      this.prompt_dialog.returnValue = null;
      this.prompt_dialog.showModal();
    });
  }

  // Display a transient message in a "toast" popup.
  // Not technically a dialog. Note that this function does not
  // return a Promise.
  notify(message) {
    let toast = document.querySelector('.mdl-js-snackbar');
    toast.MaterialSnackbar.showSnackbar({message: message});
  }

  _create_file_table(files, selectable) {
    // Convert files object into a list
    let filelist = [];
    for(let filename in files) {
      filelist.push({
        name: filename,
        date: files[filename].date,
        size: files[filename].size,
        public: files[filename].public
      });
    }

    // Sort to make most recent first
    filelist.sort((a,b) => b.date - a.date);

    function fileSize(n) {
      if (n < 512) {
        return n + ' B';
      }
      else {
        return Math.round(n / 1025) + ' kB';
      }
    }

    let table = document.createElement('table');
    table.className = 'mdl-data-table mdl-js-data-table mdl-shadow--2dp';
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');
    table.append(thead, tbody);

    // Create the header row
    let header = document.createElement('tr');
    if (selectable) {
      header.append(document.createElement('th'));
    }
    let h1 = document.createElement('th');
    h1.append('Name');
    h1.className = 'mdl-data-table__cell--non-numeric';
    let h2 = document.createElement('th');
    h2.append('Date');
    h2.className = 'mdl-data-table__cell--non-numeric';
    let h3 = document.createElement('th');
    h3.append('Size');
    header.append(h1, h2, h3);
    thead.append(header);

    // Add a row to the dialog for each file
    filelist.forEach((file,index) => {
      let row = document.createElement('tr');
      row.dataset.filename = file.name;

      if (selectable) {
        let id = 'table-row-' + index;
        let cell = document.createElement('td');
        let label = document.createElement('label');
        label.className = 'mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select';
        label.htmlFor = id;
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.className = 'mdl-checkbox__input';
        label.append(checkbox);
        cell.append(label)
        row.append(cell);
        componentHandler.upgradeElement(label);
      }

      let cell1 = document.createElement('td');
      let cell2 = document.createElement('td');
      let cell3 = document.createElement('td');
      cell1.className = "mdl-data-table__cell--non-numeric";
      cell2.className = "mdl-data-table__cell--non-numeric";
      cell1.append(file.name);
      cell2.append(moment(file.date).fromNow());
      cell2.title = moment(file.date).format('LLLL');
      cell3.append(fileSize(file.size));
      row.append(cell1, cell2, cell3);
      tbody.append(row);
    })

    componentHandler.upgradeElement(table);
    return table;
  }

  open(files) {
    return new Promise((resolve, reject) => {
      let table = this._create_file_table(files);
      this.open_dialog.querySelector('.mdl-dialog__content').append(table);
      this.open_dialog_okay.disabled = true;  // until a file is selected
      this.open_dialog._resolver = resolve;
      this.open_dialog.returnValue = null;
      this.open_dialog.showModal();
    });
  }

  delete(files) {
    return new Promise((resolve, reject) => {
      let table = this._create_file_table(files, true);
      this.delete_dialog.querySelector('.mdl-dialog__content').append(table);
      this.delete_dialog._resolver = resolve;
      this.delete_dialog.returnValue = null;
      this.delete_dialog.showModal();
    });
  }
};
