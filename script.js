// 1. Inject CSS styles for the save modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
  .poe-save-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: 'Fontin', 'Arial', sans-serif;
  }
  .poe-save-modal {
    background-color: #0b0c10;
    background-image: radial-gradient(circle at center, #171d2b 0%, #090a0f 100%);
    border: 2px solid #8a5609;
    border-radius: 6px;
    width: 380px;
    padding: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    gap: 15px;
    color: #e0e0e0;
  }
  .poe-save-modal h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
    text-transform: uppercase;
    border-bottom: 1px solid #2b3542;
    padding-bottom: 10px;
    letter-spacing: 0.5px;
    text-align: center;
    font-weight: normal;
  }
  .poe-save-modal-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .poe-save-modal-field label {
    font-size: 11px;
    color: #b77b23;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .poe-save-modal-field input, .poe-save-modal-field select {
    padding: 8px 12px;
    background-color: #0c0d12;
    border: 1px solid #36445c;
    color: #fff;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }
  .poe-save-modal-field input:focus, .poe-save-modal-field select:focus {
    border-color: #b77b23;
  }
  .poe-save-modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 5px;
  }
  .poe-save-modal-btn {
    padding: 8px 18px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .poe-save-modal-btn.save {
    background-color: #357938;
    color: #fff;
  }
  .poe-save-modal-btn.save:hover {
    background-color: #2d662f;
  }
  .poe-save-modal-btn.cancel {
    background-color: #1a2233;
    border: 1px solid #36445c;
    color: #e0e0e0;
  }
  .poe-save-modal-btn.cancel:hover {
    background-color: #27344c;
    color: #fff;
  }
`;
document.head.appendChild(modalStyle);

// 2. Main Logic Helper functions
function getSearchUrlInfo() {
  const url = window.location.href;
  // Match "/trade2/search/League/SearchId" or "/trade2/search/poe2/League/SearchId"
  const match = url.match(/\/trade2\/search\/(?:poe2\/)?([^\/]+)\/([a-zA-Z0-9]+)$/);
  if (match) {
    return {
      league: match[1],
      searchId: match[2],
      fullUrl: url
    };
  }
  return null;
}

// Global modal instance variable to prevent multiple open modals
let activeModalOverlay = null;

function showSaveModal(currentUrl, lang) {
  // If a modal is already open, do nothing
  if (activeModalOverlay) return;

  const defaultPrefix = window.getLocaleString('promptDefaultName', lang);
  const defaultName = `${defaultPrefix} ${new Date().toLocaleDateString()}`;

  // Fetch groups from storage
  chrome.storage.sync.get(['groups', 'savedUrls'], (data) => {
    const groups = data.groups || [];
    const savedUrls = data.savedUrls || [];

    // Verify duplicate URL beforehand
    if (savedUrls.some(item => item.url === currentUrl)) {
      alert(window.getLocaleString("alreadySaved", lang));
      return;
    }

    // Create Modal DOM Elements
    const overlay = document.createElement('div');
    overlay.classList.add('poe-save-modal-overlay');

    const modal = document.createElement('div');
    modal.classList.add('poe-save-modal');

    // Title
    const title = document.createElement('h3');
    title.textContent = window.getLocaleString('saveFilterButton', lang);
    modal.appendChild(title);

    // Filter Name Field
    const nameField = document.createElement('div');
    nameField.classList.add('poe-save-modal-field');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = window.getLocaleString('promptFilterName', lang);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = defaultName;
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    modal.appendChild(nameField);

    // Group Dropdown Field
    const groupField = document.createElement('div');
    groupField.classList.add('poe-save-modal-field');
    const groupLabel = document.createElement('label');
    groupLabel.textContent = window.getLocaleString('moveItemTitle', lang);
    const groupSelect = document.createElement('select');

    // Populate dropdown options
    // 1. Default Ungrouped option
    const optUngrouped = document.createElement('option');
    optUngrouped.value = 'ungrouped';
    optUngrouped.textContent = window.getLocaleString('groupUngrouped', lang);
    groupSelect.appendChild(optUngrouped);

    // 2. User groups
    groups.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      groupSelect.appendChild(opt);
    });

    // 3. New Group Creator option
    const optCreateNew = document.createElement('option');
    optCreateNew.value = 'create_new';
    optCreateNew.textContent = window.getLocaleString('createGroupOption', lang);
    groupSelect.appendChild(optCreateNew);

    groupField.appendChild(groupLabel);
    groupField.appendChild(groupSelect);
    modal.appendChild(groupField);

    // Dynamic New Group Name Field (Hidden by default)
    const newGroupField = document.createElement('div');
    newGroupField.classList.add('poe-save-modal-field');
    newGroupField.style.display = 'none';
    const newGroupLabel = document.createElement('label');
    newGroupLabel.textContent = window.getLocaleString('newGroupPlaceholder', lang);
    const newGroupInput = document.createElement('input');
    newGroupInput.type = 'text';
    newGroupField.appendChild(newGroupLabel);
    newGroupField.appendChild(newGroupInput);
    modal.appendChild(newGroupField);

    // Listen to dropdown value to toggle new group input
    groupSelect.addEventListener('change', () => {
      if (groupSelect.value === 'create_new') {
        newGroupField.style.display = 'flex';
        newGroupInput.focus();
      } else {
        newGroupField.style.display = 'none';
        newGroupInput.value = '';
      }
    });

    // Buttons Actions container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('poe-save-modal-buttons');

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('poe-save-modal-btn', 'cancel');
    cancelBtn.textContent = window.getLocaleString('cancelBtn', lang);

    const saveBtn = document.createElement('button');
    saveBtn.classList.add('poe-save-modal-btn', 'save');
    saveBtn.textContent = window.getLocaleString('saveBtn', lang);

    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(saveBtn);
    modal.appendChild(buttonsContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeModalOverlay = overlay;
    nameInput.focus();
    nameInput.select();

    // Close Modal Helper
    const closeModal = () => {
      if (activeModalOverlay) {
        activeModalOverlay.remove();
        activeModalOverlay = null;
      }
    };

    // Events
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Handle Save Click
    saveBtn.addEventListener('click', () => {
      const finalName = nameInput.value.trim() || defaultName;
      let finalGroupId = groupSelect.value;
      const newGroupName = newGroupInput.value.trim();

      const executeSave = (groupIdToUse) => {
        chrome.storage.sync.get(['savedUrls'], (store) => {
          const currentSaved = store.savedUrls || [];
          currentSaved.push({
            id: Date.now(),
            url: currentUrl,
            description: finalName,
            groupId: groupIdToUse
          });
          chrome.storage.sync.set({ savedUrls: currentSaved }, () => {
            closeModal();
            alert(window.getLocaleString('saveSuccess', lang));
          });
        });
      };

      if (finalGroupId === 'create_new') {
        if (!newGroupName) {
          alert(window.getLocaleString('alertEmptyGroupName', lang));
          newGroupInput.focus();
          return;
        }

        // Check if group name already exists
        const exists = groups.some(g => g.name.toLowerCase() === newGroupName.toLowerCase());
        if (exists) {
          alert(window.getLocaleString('alertDuplicateGroup', lang));
          newGroupInput.focus();
          return;
        }

        // Create the group
        const newGroupId = 'group_' + Date.now();
        const updatedGroups = [...groups, { id: newGroupId, name: newGroupName }];

        chrome.storage.sync.set({ groups: updatedGroups }, () => {
          executeSave(newGroupId);
        });
      } else {
        executeSave(finalGroupId);
      }
    });

    // Save with Enter on name/newgroup inputs
    const enterTrigger = (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    };
    nameInput.addEventListener('keydown', enterTrigger);
    newGroupInput.addEventListener('keydown', enterTrigger);
  });
}

function updateSaveButton() {
  const info = getSearchUrlInfo();
  const controlsCenter = document.querySelector('.controls-center');
  
  if (!controlsCenter) {
    return; // Controls not loaded yet
  }
  
  let saveBtn = document.getElementById('save-filter-btn');
  
  if (info) {
    if (!saveBtn) {
      saveBtn = document.createElement('button');
      saveBtn.id = 'save-filter-btn';
      
      // Polish button styles to match PoE2 theme
      saveBtn.style.backgroundColor = '#357938';
      saveBtn.style.color = 'white';
      saveBtn.style.border = 'none';
      saveBtn.style.cursor = 'pointer';
      saveBtn.style.marginLeft = '10px';
      saveBtn.style.padding = '8px 16px';
      saveBtn.style.fontSize = '12px';
      saveBtn.style.fontFamily = 'fontin, Arial, sans-serif';
      saveBtn.style.textTransform = 'uppercase';
      saveBtn.style.borderRadius = '4px';
      saveBtn.style.transition = 'background-color 0.2s';
      
      saveBtn.addEventListener('mouseenter', () => {
        saveBtn.style.backgroundColor = '#2d662f';
      });
      saveBtn.addEventListener('mouseleave', () => {
        saveBtn.style.backgroundColor = '#357938';
      });

      // Fetch user settings (for language translation)
      chrome.storage.sync.get(['userLanguage'], (data) => {
        const lang = data.userLanguage || (chrome.i18n.getUILanguage().substring(0, 2).toLowerCase() === 'ru' ? 'ru' : 'en');
        saveBtn.textContent = window.getLocaleString("saveFilterButton", lang);
        
        // Modal Save Action
        saveBtn.addEventListener('click', () => {
          const currentUrl = window.location.href;
          chrome.storage.sync.get(['userLanguage'], (dynamicData) => {
            const dynamicLang = dynamicData.userLanguage || lang;
            showSaveModal(currentUrl, dynamicLang);
          });
        });
      });
      
      controlsCenter.appendChild(saveBtn);
    }
  } else {
    if (saveBtn) {
      saveBtn.remove();
    }
  }
}

// Observe DOM mutations to handle client-side rendering/navigation
const observer = new MutationObserver(() => {
  updateSaveButton();
});

// Start observing the document body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Periodic check (every 500ms) to ensure URL changes (e.g. via pushState) are detected immediately
setInterval(updateSaveButton, 500);

// Run the initial check
updateSaveButton();
