document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'en';
    let currentViewMode = 'list';
    let collapsedGroups = {}; // store collapsed state of groups (id -> boolean)

    // Elements
    const savedUrlsContainer = document.getElementById('savedUrlsContainer');
    const langSelectContainer = document.getElementById('langSelectContainer');
    const langSelectTrigger = document.getElementById('langSelectTrigger');
    const langSelectOptions = document.getElementById('langSelectOptions');
    const selectedLangFlag = document.getElementById('selectedLangFlag');
    const selectedLangText = document.getElementById('selectedLangText');
    const viewListBtn = document.getElementById('viewListBtn');
    const viewGridBtn = document.getElementById('viewGridBtn');
    const toggleAddGroupBtn = document.getElementById('toggleAddGroupBtn');
    const addGroupContainer = document.getElementById('addGroupContainer');
    const newGroupNameInput = document.getElementById('newGroupNameInput');
    const saveNewGroupBtn = document.getElementById('saveNewGroupBtn');
    const searchBarInput = document.getElementById('searchBarInput');
    const infoBtn = document.getElementById('infoBtn');
    const infoBlock = document.getElementById('infoBlock');

    // 1. Language and Translation engine
    const translatePage = () => {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const message = window.getLocaleString(key, currentLang);
            if (message) {
                element.textContent = message;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            const message = window.getLocaleString(key, currentLang);
            if (message) {
                element.placeholder = message;
            }
        });

        // Translate titles (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            const message = window.getLocaleString(key, currentLang);
            if (message) {
                element.title = message;
            }
        });

        // Sync custom language select dropdown values
        const langFlagMapping = {
            en: 'gb',
            ru: 'ru',
            fr: 'fr',
            pt: 'br',
            de: 'de',
            es: 'es',
            th: 'th',
            ja: 'jp'
        };
        const countryCode = langFlagMapping[currentLang] || 'gb';
        selectedLangFlag.src = `https://flagcdn.com/w20/${countryCode}.png`;
        selectedLangText.textContent = currentLang.toUpperCase();
        
        // Sync active option class
        document.querySelectorAll('.select-option').forEach((opt) => {
            if (opt.getAttribute('data-lang') === currentLang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    };

    const setLanguage = (lang) => {
        currentLang = lang;
        chrome.storage.sync.set({ userLanguage: lang }, () => {
            translatePage();
            // Re-render to translate dynamic text
            loadAndDisplayData();
        });
    };

    // Toggle custom dropdown options
    langSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const show = langSelectOptions.style.display === 'none';
        langSelectOptions.style.display = show ? 'block' : 'none';
        langSelectTrigger.classList.toggle('active', show);
    });

    // Select option click
    document.querySelectorAll('.select-option').forEach((opt) => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = opt.getAttribute('data-lang');
            setLanguage(selectedLang);
            langSelectOptions.style.display = 'none';
            langSelectTrigger.classList.remove('active');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        langSelectOptions.style.display = 'none';
        langSelectTrigger.classList.remove('active');
    });

    // 2. View Mode switcher
    const setViewMode = (mode) => {
        currentViewMode = mode;
        chrome.storage.sync.set({ viewMode: mode }, () => {
            if (mode === 'grid') {
                viewGridBtn.classList.add('active');
                viewListBtn.classList.remove('active');
            } else {
                viewListBtn.classList.add('active');
                viewGridBtn.classList.remove('active');
            }
            loadAndDisplayData();
        });
    };

    viewListBtn.addEventListener('click', () => setViewMode('list'));
    viewGridBtn.addEventListener('click', () => setViewMode('grid'));

    // 3. Group Creation Toggle
    toggleAddGroupBtn.addEventListener('click', () => {
        if (addGroupContainer.style.display === 'none') {
            addGroupContainer.style.display = 'flex';
            newGroupNameInput.focus();
        } else {
            addGroupContainer.style.display = 'none';
            newGroupNameInput.value = '';
        }
    });

    saveNewGroupBtn.addEventListener('click', () => {
        const groupName = newGroupNameInput.value.trim();
        if (!groupName) {
            alert(window.getLocaleString('alertEmptyGroupName', currentLang));
            return;
        }

        chrome.storage.sync.get(['groups'], (data) => {
            const groups = data.groups || [];
            if (groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
                alert(window.getLocaleString('alertDuplicateGroup', currentLang));
                return;
            }

            const newGroup = {
                id: 'group_' + Date.now(),
                name: groupName
            };
            groups.push(newGroup);

            chrome.storage.sync.set({ groups }, () => {
                newGroupNameInput.value = '';
                addGroupContainer.style.display = 'none';
                loadAndDisplayData();
            });
        });
    });

    newGroupNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveNewGroupBtn.click();
        }
    });

    // Real-time Search input handler
    searchBarInput.addEventListener('input', () => {
        loadAndDisplayData();
    });

    // Toggle collapsible instruction block
    infoBtn.addEventListener('click', () => {
        const show = infoBlock.style.display === 'none';
        infoBlock.style.display = show ? 'block' : 'none';
        infoBtn.classList.toggle('active', show);
    });

    // 4. Data display and render logic
    const loadAndDisplayData = () => {
        chrome.storage.sync.get(['savedUrls', 'groups'], (data) => {
            const urls = data.savedUrls || [];
            const groups = data.groups || [];

            // Apply real-time search filtering
            const searchQuery = searchBarInput.value.toLowerCase().trim();
            const filteredUrls = urls.filter(entry => 
                (entry.description && entry.description.toLowerCase().includes(searchQuery)) ||
                (entry.url && entry.url.toLowerCase().includes(searchQuery))
            );

            renderFilters(filteredUrls, groups, urls);
        });
    };

    const renderFilters = (filteredUrls, groups, allUrls) => {
        savedUrlsContainer.innerHTML = '';

        if (!allUrls || allUrls.length === 0) {
            const noUrlsMessage = document.createElement('p');
            noUrlsMessage.textContent = window.getLocaleString('noSavedUrls', currentLang);
            noUrlsMessage.classList.add('no-urls-message');
            savedUrlsContainer.appendChild(noUrlsMessage);
            return;
        }

        // Determine if we have any favorited items (among filtered ones)
        const favoriteUrls = filteredUrls.filter(entry => entry.favorite);

        // Build folder sections
        const allSections = [];
        
        // 1. Add Favorites folder at the very top if it has items
        if (favoriteUrls.length > 0) {
            allSections.push({
                id: 'favorites',
                name: window.getLocaleString('groupFavorites', currentLang),
                isFavorites: true,
                items: favoriteUrls
            });
        }

        // 2. User groups
        groups.forEach((g) => {
            const groupItems = filteredUrls.filter(entry => entry.groupId === g.id);
            allSections.push({
                id: g.id,
                name: g.name,
                isFavorites: false,
                items: groupItems
            });
        });

        // 3. Ungrouped folder
        const ungroupedItems = filteredUrls.filter((entry) => {
            return !entry.groupId || entry.groupId === 'ungrouped' || !groups.some(g => g.id === entry.groupId);
        });
        
        // Only show Ungrouped if there are ungrouped items, or if there's no search query active (to prevent empty folders clutter)
        if (ungroupedItems.length > 0 || searchBarInput.value.trim() === '') {
            allSections.push({
                id: 'ungrouped',
                name: window.getLocaleString('groupUngrouped', currentLang),
                isFavorites: false,
                items: ungroupedItems
            });
        }

        allSections.forEach((section) => {
            // If search is active, hide empty folders completely
            if (searchBarInput.value.trim() !== '' && section.items.length === 0) {
                return;
            }

            // 4.1 Folder Element (Accordion)
            const folderWrapper = document.createElement('div');
            folderWrapper.classList.add('folder-wrapper');
            if (section.isFavorites) {
                folderWrapper.classList.add('favorites-folder');
            }
            if (collapsedGroups[section.id]) {
                folderWrapper.classList.add('collapsed');
            }

            const folderHeader = document.createElement('div');
            folderHeader.classList.add('folder-header');

            const headerLeft = document.createElement('div');
            headerLeft.classList.add('folder-title-section');
            
            const caretIcon = document.createElement('i');
            caretIcon.classList.add('fa-solid', collapsedGroups[section.id] ? 'fa-chevron-right' : 'fa-chevron-down', 'folder-caret');
            
            const folderIcon = document.createElement('i');
            if (section.isFavorites) {
                folderIcon.classList.add('fa-solid', 'fa-star', 'folder-icon', 'star-accent');
            } else {
                folderIcon.classList.add('fa-regular', collapsedGroups[section.id] ? 'fa-folder' : 'fa-folder-open', 'folder-icon');
            }

            const folderTitle = document.createElement('span');
            folderTitle.textContent = `${section.name} (${section.items.length})`;
            folderTitle.classList.add('folder-title');

            headerLeft.appendChild(caretIcon);
            headerLeft.appendChild(folderIcon);
            headerLeft.appendChild(folderTitle);

            folderHeader.appendChild(headerLeft);

            // Group delete button (except for "Ungrouped" and "Favorites")
            if (section.id !== 'ungrouped' && !section.isFavorites) {
                const deleteGroupBtn = document.createElement('button');
                deleteGroupBtn.classList.add('delete-group-btn');
                deleteGroupBtn.title = window.getLocaleString('deleteGroupTitle', currentLang);
                deleteGroupBtn.innerHTML = '<i class="fa-solid fa-folder-minus"></i>';
                
                deleteGroupBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent collapsing group
                    const confirmMsg = window.getLocaleString('alertConfirmDeleteGroup', currentLang);
                    if (confirm(confirmMsg)) {
                        // Delete the group
                        const updatedGroups = groups.filter(g => g.id !== section.id);
                        // Move group's filters to ungrouped
                        const updatedUrls = allUrls.map(entry => 
                            entry.groupId === section.id ? { ...entry, groupId: 'ungrouped' } : entry
                        );
                        chrome.storage.sync.set({ groups: updatedGroups, savedUrls: updatedUrls }, () => {
                            loadAndDisplayData();
                        });
                    }
                });
                folderHeader.appendChild(deleteGroupBtn);
            }

            // Click header to toggle collapse
            folderHeader.addEventListener('click', () => {
                collapsedGroups[section.id] = !collapsedGroups[section.id];
                folderWrapper.classList.toggle('collapsed');
                caretIcon.classList.toggle('fa-chevron-down');
                caretIcon.classList.toggle('fa-chevron-right');
                
                if (!section.isFavorites) {
                    folderIcon.classList.toggle('fa-folder-open');
                    folderIcon.classList.toggle('fa-folder');
                }
            });

            folderWrapper.appendChild(folderHeader);

            // 4.2 Group Content Container
            const folderContent = document.createElement('div');
            folderContent.classList.add('folder-content');
            if (currentViewMode === 'grid') {
                folderContent.classList.add('grid-layout');
            } else {
                folderContent.classList.add('list-layout');
            }

            section.items.forEach((entry) => {
                const { id, url, description, groupId: itemGroupId, favorite } = entry;

                const urlItem = document.createElement('div');
                urlItem.classList.add('url-item');

                const urlDetails = document.createElement('div');
                urlDetails.classList.add('url-details');

                // Text Description
                const urlDescription = document.createElement('p');
                const fallbackDesc = window.getLocaleString('editDescriptionPlaceholder', currentLang);
                const displayText = description || fallbackDesc;
                urlDescription.textContent = displayText;
                urlDescription.classList.add('url-description');
                urlDescription.title = displayText;

                // Edit Input Field
                const urlInput = document.createElement('input');
                urlInput.value = description || '';
                urlInput.classList.add('url-input');
                urlInput.placeholder = window.getLocaleString('placeholderInput', currentLang);
                urlInput.style.display = 'none';

                // Edit Group Selector Dropdown
                const groupSelect = document.createElement('select');
                groupSelect.classList.add('url-group-select');
                groupSelect.style.display = 'none';
                groupSelect.title = window.getLocaleString('moveItemTitle', currentLang);

                // Populate group dropdown
                groups.forEach((g) => {
                    const opt = document.createElement('option');
                    opt.value = g.id;
                    opt.textContent = g.name;
                    if (g.id === (itemGroupId || 'ungrouped')) {
                        opt.selected = true;
                    }
                    groupSelect.appendChild(opt);
                });
                // Add ungrouped option
                const optUngrouped = document.createElement('option');
                optUngrouped.value = 'ungrouped';
                optUngrouped.textContent = window.getLocaleString('groupUngrouped', currentLang);
                if (!itemGroupId || itemGroupId === 'ungrouped') {
                    optUngrouped.selected = true;
                }
                groupSelect.appendChild(optUngrouped);

                // Action Link
                const urlLink = document.createElement('a');
                urlLink.href = url;
                urlLink.target = '_blank';
                urlLink.textContent = window.getLocaleString('filterLink', currentLang);
                urlLink.classList.add('url-link');
                urlLink.title = url;

                urlDetails.appendChild(urlDescription);
                urlDetails.appendChild(urlInput);
                urlDetails.appendChild(groupSelect);
                urlDetails.appendChild(urlLink);

                // Buttons container
                const urlButtons = document.createElement('div');
                urlButtons.classList.add('url-buttons');

                // Star (Favorite) button
                const favoriteButton = document.createElement('button');
                favoriteButton.classList.add('favorite-button');
                if (favorite) {
                    favoriteButton.classList.add('active');
                    favoriteButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                } else {
                    favoriteButton.innerHTML = '<i class="fa-regular fa-star"></i>';
                }
                favoriteButton.title = window.getLocaleString('groupFavorites', currentLang);

                const editButton = document.createElement('button');
                editButton.classList.add('edit-button');
                editButton.title = window.getLocaleString('editItemTitle', currentLang);
                editButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';

                const saveButton = document.createElement('button');
                saveButton.classList.add('save-button');
                saveButton.title = window.getLocaleString('saveBtn', currentLang);
                saveButton.style.display = 'none';
                saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.title = window.getLocaleString('deleteItemTitle', currentLang);
                deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

                urlButtons.appendChild(favoriteButton);
                urlButtons.appendChild(editButton);
                urlButtons.appendChild(saveButton);
                urlButtons.appendChild(deleteButton);

                // Event Listeners on Item Actions
                favoriteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const updatedUrls = allUrls.map((item) => {
                        if (item.id === id) {
                            return {
                                ...item,
                                favorite: !item.favorite
                            };
                        }
                        return item;
                    });
                    chrome.storage.sync.set({ savedUrls: updatedUrls }, () => {
                        loadAndDisplayData();
                    });
                });

                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    urlDescription.style.display = 'none';
                    urlInput.style.display = 'inline-block';
                    groupSelect.style.display = 'inline-block';
                    saveButton.style.display = 'inline-block';
                    editButton.style.display = 'none';
                    urlInput.focus();
                });

                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const confirmMsg = window.getLocaleString('alertConfirmDeleteItem', currentLang);
                    if (confirm(confirmMsg)) {
                        const updatedUrls = allUrls.filter((item) => item.id !== id);
                        chrome.storage.sync.set({ savedUrls: updatedUrls }, () => {
                            loadAndDisplayData();
                        });
                    }
                });

                saveButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newDescription = urlInput.value.trim();
                    const newGroupId = groupSelect.value;

                    const updatedUrls = allUrls.map((item) => {
                        if (item.id === id) {
                            return {
                                ...item,
                                description: newDescription,
                                groupId: newGroupId
                            };
                        }
                        return item;
                    });

                    chrome.storage.sync.set({ savedUrls: updatedUrls }, () => {
                        loadAndDisplayData();
                    });
                });

                // Press enter in input field to save
                urlInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveButton.click();
                    }
                });

                urlItem.appendChild(urlDetails);
                urlItem.appendChild(urlButtons);
                folderContent.appendChild(urlItem);
            });

            folderWrapper.appendChild(folderContent);
            savedUrlsContainer.appendChild(folderWrapper);
        });
    };

    // 5. Initial setup: Read storage and load settings
    chrome.storage.sync.get(['userLanguage', 'viewMode'], (data) => {
        // Language setup
        if (data.userLanguage) {
            currentLang = data.userLanguage;
        } else {
            const browserLang = chrome.i18n.getUILanguage().substring(0, 2).toLowerCase();
            const supportedLangs = ['en', 'ru', 'fr', 'pt', 'de', 'es', 'th', 'ja'];
            currentLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
        }

        // View mode setup
        if (data.viewMode) {
            currentViewMode = data.viewMode;
        }

        // Setup active classes on switcher controls
        if (currentViewMode === 'grid') {
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
        } else {
            viewListBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
        }

        // Apply translations
        translatePage();

        // Render UI
        loadAndDisplayData();
    });
});
