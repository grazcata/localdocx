import { htmlToDocx } from './docx-converter.js';

// App State
const state = {
  activeDocId: null,
  docs: [],
  theme: localStorage.getItem('localdocx_theme') || 'light',
  stats: { words: 0, chars: 0 }
};

// Storage Key
const STORAGE_KEY = 'localdocx_documents_v1';
const ACTIVE_ID_KEY = 'localdocx_active_id';

// Elements
const editor = document.getElementById('editor');
const docTitle = document.getElementById('doc-title');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const readTimeEl = document.getElementById('read-time');
const saveStatusEl = document.getElementById('save-status');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const docListEl = document.getElementById('doc-list');
const themeToggle = document.getElementById('theme-toggle');

// Initialize
export function initApp() {
  applyTheme(state.theme);
  loadDocuments();
  setupToolbar();
  setupEditorEvents();
  setupDrawer();
  setupFileHandlers();
  setupPwa();
}

function loadDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.docs = raw ? JSON.parse(raw) : [];
  } catch (e) {
    state.docs = [];
  }

  const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
  if (state.docs.length === 0) {
    // Create default welcome document
    createInitialDocument();
  } else {
    const existing = state.docs.find(d => d.id === savedActiveId) || state.docs[0];
    openDocument(existing.id);
  }
  renderDocList();
}

function createInitialDocument() {
  const newDoc = {
    id: 'doc_' + Date.now(),
    title: 'Mon Premier Document',
    content: `<h1>Bienvenue sur LocalDocx</h1><p>Cette application vous permet de <b>créer</b>, <b>éditer</b> et <b>exporter</b> de vrais fichiers <b>.docx</b> (Microsoft Word) directement sur votre téléphone Android.</p><h2>🔒 100% Local & Privé</h2><p>Tous vos documents restent stockés <b>exclusivement dans votre téléphone</b>. Aucune donnée n'est envoyée vers un serveur cloud.</p><h3>✨ Fonctionnalités</h3><ul><li>Formatage de texte : <b>Gras</b>, <i>Italique</i>, <u>Souligné</u>, <mark>Surlignage</mark>.</li><li>Titres, listes à puces et listes ordonnées.</li><li>Insertion et modification de tableaux.</li><li>Importation de fichiers <code>.docx</code> existants.</li><li>Exportation instantanée en fichier <code>.docx</code> natif.</li><li>Sauvegarde automatique continue en local.</li></ul><blockquote>« La liberté commence lorsque vos documents vous appartiennent vraiment. »</blockquote><p>Tapez simplement votre texte ici pour commencer !</p>`,
    updatedAt: Date.now()
  };
  state.docs.push(newDoc);
  saveDocsToStorage();
  openDocument(newDoc.id);
}

function saveDocsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.docs));
  if (state.activeDocId) {
    localStorage.setItem(ACTIVE_ID_KEY, state.activeDocId);
  }
}

function openDocument(id) {
  const doc = state.docs.find(d => d.id === id);
  if (!doc) return;

  state.activeDocId = doc.id;
  docTitle.value = doc.title || 'Sans titre';
  editor.innerHTML = doc.content || '<p></p>';
  updateStats();
  renderDocList();
  closeDrawer();
  setSaveStatus('Enregistré en local');
}

function saveCurrentDocument() {
  if (!state.activeDocId) return;
  const doc = state.docs.find(d => d.id === state.activeDocId);
  if (doc) {
    doc.title = docTitle.value.trim() || 'Sans titre';
    doc.content = editor.innerHTML;
    doc.updatedAt = Date.now();
    saveDocsToStorage();
    renderDocList();
    setSaveStatus('Enregistré en local');
  }
}

function setSaveStatus(text) {
  if (saveStatusEl) {
    saveStatusEl.textContent = text;
  }
}

// Stats Calculation
function updateStats() {
  const text = editor.innerText || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const minutes = Math.ceil(words / 200) || 1;

  if (wordCountEl) wordCountEl.textContent = `${words} mots`;
  if (charCountEl) charCountEl.textContent = `${chars} car.`;
  if (readTimeEl) readTimeEl.textContent = `~${minutes} min`;
}

// Editor Events
function setupEditorEvents() {
  let debounceTimeout = null;

  editor.addEventListener('input', () => {
    setSaveStatus('Modifications en cours...');
    updateStats();
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      saveCurrentDocument();
    }, 400);
  });

  docTitle.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      saveCurrentDocument();
    }, 400);
  });

  const pageSheet = document.querySelector('.page-sheet');
  if (pageSheet) {
    pageSheet.addEventListener('click', (e) => {
      if (e.target === pageSheet) {
        editor.focus();
      }
    });
  }
}

// Toolbar Setup
function setupToolbar() {
  document.querySelectorAll('[data-cmd]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = button.getAttribute('data-cmd');
      const val = button.getAttribute('data-val') || null;

      if (cmd === 'createLink') {
        const url = prompt('Entrez l\'URL du lien :', 'https://');
        if (url) document.execCommand(cmd, false, url);
      } else if (cmd === 'insertTable') {
        insertTablePrompt();
      } else {
        document.execCommand(cmd, false, val);
      }
      editor.focus();
      saveCurrentDocument();
    });
  });

  const headingSelect = document.getElementById('heading-select');
  if (headingSelect) {
    headingSelect.addEventListener('change', () => {
      const val = headingSelect.value;
      if (val === 'p') {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, `<${val}>`);
      }
      editor.focus();
      saveCurrentDocument();
    });
  }

  // Highlight button
  const highlightBtn = document.getElementById('btn-highlight');
  if (highlightBtn) {
    highlightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand('hiliteColor', false, '#fef08a');
      editor.focus();
      saveCurrentDocument();
    });
  }
}

function insertTablePrompt() {
  const rows = parseInt(prompt('Nombre de lignes (ex: 3) :', '3'), 10) || 3;
  const cols = parseInt(prompt('Nombre de colonnes (ex: 3) :', '3'), 10) || 3;

  let html = '<table border="1" style="width: 100%; border-collapse: collapse; margin: 12px 0;">';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      if (r === 0) {
        html += `<th style="padding: 8px; background: rgba(0,0,0,0.05); font-weight: bold;">En-tête ${c + 1}</th>`;
      } else {
        html += `<td style="padding: 8px;">Cellule</td>`;
      }
    }
    html += '</tr>';
  }
  html += '</table><p></p>';
  document.execCommand('insertHTML', false, html);
}

// Drawer & Documents List
function setupDrawer() {
  const openDrawerBtn = document.getElementById('btn-open-drawer');
  const closeDrawerBtn = document.getElementById('btn-close-drawer');
  const newDocBtn = document.getElementById('btn-new-doc');

  if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  if (newDocBtn) {
    newDocBtn.addEventListener('click', () => {
      const newDoc = {
        id: 'doc_' + Date.now(),
        title: 'Nouveau document',
        content: '<p></p>',
        updatedAt: Date.now()
      };
      state.docs.unshift(newDoc);
      saveDocsToStorage();
      openDocument(newDoc.id);
    });
  }
}

function openDrawer() {
  if (drawer && drawerOverlay) {
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }
}

function closeDrawer() {
  if (drawer && drawerOverlay) {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }
}

function renderDocList() {
  if (!docListEl) return;
  docListEl.innerHTML = '';

  state.docs.forEach(doc => {
    const item = document.createElement('div');
    item.className = `doc-item ${doc.id === state.activeDocId ? 'active' : ''}`;
    
    const dateStr = new Date(doc.updatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <div class="doc-item-info">
        <span class="doc-item-title">${escapeHtml(doc.title || 'Sans titre')}</span>
        <span class="doc-item-date">${dateStr}</span>
      </div>
      <button class="doc-item-delete" title="Supprimer" data-delete-id="${doc.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    `;

    item.querySelector('.doc-item-info').addEventListener('click', () => {
      openDocument(doc.id);
    });

    item.querySelector('.doc-item-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Supprimer « ${doc.title} » ?`)) {
        deleteDocument(doc.id);
      }
    });

    docListEl.appendChild(item);
  });
}

function deleteDocument(id) {
  state.docs = state.docs.filter(d => d.id !== id);
  if (state.docs.length === 0) {
    createInitialDocument();
  } else if (state.activeDocId === id) {
    openDocument(state.docs[0].id);
  } else {
    saveDocsToStorage();
    renderDocList();
  }
}

// File Import & Export
function setupFileHandlers() {
  const importInput = document.getElementById('import-file-input');
  const exportBtn = document.getElementById('btn-export-docx');
  const printBtn = document.getElementById('btn-print-doc');

  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setSaveStatus('Importation en cours...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.convertToHtml({ arrayBuffer });
        
        const fileName = file.name.replace(/\.docx$/i, '');
        const newDoc = {
          id: 'doc_' + Date.now(),
          title: fileName,
          content: result.value || '<p></p>',
          updatedAt: Date.now()
        };

        state.docs.unshift(newDoc);
        saveDocsToStorage();
        openDocument(newDoc.id);
        alert(`Document « ${fileName} » importé avec succès !`);
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la lecture du fichier DOCX : ' + err.message);
      } finally {
        importInput.value = '';
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        setSaveStatus('Génération du .docx...');
        const title = docTitle.value.trim() || 'Document';
        const docxDoc = htmlToDocx(editor, { title });
        
        const blob = await window.docx.Packer.toBlob(docxDoc);
        
        const fileName = `${title.replace(/[/\\?%*:|"<>]/g, '_')}.docx`;

        // If running inside Android Native APK Bridge
        if (window.AndroidBridge && typeof window.AndroidBridge.saveDocxFile === 'function') {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result;
            window.AndroidBridge.saveDocxFile(base64Data, fileName);
            setSaveStatus('Enregistré dans Téléchargements');
          };
          reader.readAsDataURL(blob);
          return;
        }

        // Standard browser / PWA download to device storage
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        setSaveStatus('Téléchargé avec succès');
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la génération du DOCX : ' + err.message);
        setSaveStatus('Erreur d\'exportation');
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Theme handling
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('localdocx_theme', theme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
}

// PWA Service Worker
function setupPwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Auto bootstrap when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
