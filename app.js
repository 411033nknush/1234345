const STORAGE_KEY = 'wordflip-words';

function loadWords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWords(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function getCurrentWord(words, index) {
  if (!words.length) return null;
  const safeIndex = ((index % words.length) + words.length) % words.length;
  return words[safeIndex];
}

function renderWordList() {
  const list = document.getElementById('wordList');
  if (!list) return;

  const words = loadWords();
  if (!words.length) {
    list.innerHTML = '<li class="rounded-2xl border border-line bg-panelStrong/90 p-4 text-muted">目前沒有任何單字，先到「管理單字」頁面新增吧。</li>';
    return;
  }

  list.innerHTML = words
    .map(
      (item) => `
        <li class="rounded-2xl border border-line bg-panelStrong/90 p-4 shadow-halo">
          <strong class="mb-1 block text-base text-text">${escapeHtml(item.english)}</strong>
          <small class="block text-muted/95">中文：${escapeHtml(item.translation || '—')}</small>
          <small class="block text-muted/95">詞性：${escapeHtml(item.partOfSpeech || '—')}</small>
          <small class="block text-muted/95">例句：${escapeHtml(item.exampleSentence || '—')}</small>
          <small class="block text-muted/95">字根分析：${escapeHtml(item.rootAnalysis || '—')}</small>
        </li>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function initStudyPage() {
  const flashcard = document.getElementById('flashcard');
  const flashcardInner = document.getElementById('flashcardInner');
  const frontWord = document.getElementById('frontWord');
  const frontHint = document.getElementById('frontHint');
  const backTranslation = document.getElementById('backTranslation');
  const backPartOfSpeech = document.getElementById('backPartOfSpeech');
  const backExample = document.getElementById('backExample');
  const backRoot = document.getElementById('backRoot');
  const studyCounter = document.getElementById('studyCounter');
  const studyTitle = document.getElementById('studyTitle');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');

  if (!flashcard || !frontWord) return;

  let currentIndex = 0;
  let cards = loadWords();

  function renderCard() {
    const card = getCurrentWord(cards, currentIndex);
    if (!card) {
      frontWord.textContent = '尚未建立任何單字';
      frontHint.textContent = '請先到管理頁新增詞庫';
      backTranslation.textContent = '—';
      backPartOfSpeech.textContent = '詞性：—';
      backExample.textContent = '例句：—';
      backRoot.textContent = '字根分析：—';
      studyCounter.textContent = '0 / 0';
      studyTitle.textContent = '詞庫空空如也';
      flashcardInner.classList.remove('is-flipped');
      return;
    }

    frontWord.textContent = card.english;
    frontHint.textContent = '點擊卡片翻面查看答題內容';
    backTranslation.textContent = card.translation || '尚未填寫中文';
    backPartOfSpeech.textContent = `詞性：${card.partOfSpeech || '—'}`;
    backExample.textContent = `例句：${card.exampleSentence || '—'}`;
    backRoot.textContent = `字根分析：${card.rootAnalysis || '—'}`;
    studyCounter.textContent = `${currentIndex + 1} / ${cards.length}`;
    studyTitle.textContent = '單字卡片';
  }

  function refreshCards() {
    cards = loadWords();
    currentIndex = 0;
    renderCard();
  }

  flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('is-flipped');
  });

  prevBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    flashcard.classList.remove('is-flipped');
    renderCard();
  });

  nextBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % cards.length;
    flashcard.classList.remove('is-flipped');
    renderCard();
  });

  shuffleBtn?.addEventListener('click', () => {
    currentIndex = Math.floor(Math.random() * cards.length);
    flashcard.classList.remove('is-flipped');
    renderCard();
  });

  window.addEventListener('storage', refreshCards);
  refreshCards();
}

function initManagePage() {
  const form = document.getElementById('wordForm');
  const autoFillBtn = document.getElementById('autoFillBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusMessage = document.getElementById('statusMessage');

  if (!form) return;

  function setStatus(text, tone = 'info') {
    statusMessage.textContent = text;
    statusMessage.classList.remove('text-danger', 'text-glow', 'text-success');
    if (tone === 'error') {
      statusMessage.classList.add('text-danger');
    } else if (tone === 'success') {
      statusMessage.classList.add('text-success');
    } else {
      statusMessage.classList.add('text-glow');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const words = loadWords();
    const item = {
      english: document.getElementById('englishWord').value.trim(),
      translation: document.getElementById('translation').value.trim(),
      partOfSpeech: document.getElementById('partOfSpeech').value.trim(),
      exampleSentence: document.getElementById('exampleSentence').value.trim(),
      rootAnalysis: document.getElementById('rootAnalysis').value.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!item.english || !item.translation) {
      setStatus('請至少填入英文與中文翻譯。', 'error');
      return;
    }

    words.unshift(item);
    saveWords(words);
    form.reset();
    setStatus(`已加入 ${item.english} 到詞庫。`);
    renderWordList();
    window.dispatchEvent(new Event('storage'));
  });

  autoFillBtn?.addEventListener('click', async () => {
    const english = document.getElementById('englishWord').value.trim();
    if (!english) {
      setStatus('請先輸入英文單字，再點擊「自動填入」。', 'error');
      return;
    }

    setStatus('正在呼叫公開 API 取得資料…');

    try {
      const [dictResponse, translateResponse] = await Promise.all([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(english)}`),
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(english)}&langpair=en|zh-TW`),
      ]);

      if (!dictResponse.ok) throw new Error('字典 API 取得失敗');
      if (!translateResponse.ok) throw new Error('翻譯 API 取得失敗');

      const dictData = await dictResponse.json();
      const translateData = await translateResponse.json();
      const entry = Array.isArray(dictData) ? dictData[0] : null;
      const meaning = entry?.meanings?.[0];
      const definition = meaning?.definitions?.[0];
      const origin = entry?.origin || '';
      const translationText = translateData?.responseData?.translatedText || '尚未取得中文翻譯';
      const partOfSpeech = meaning?.partOfSpeech || 'unknown';
      const exampleSentence = definition?.example || '目前沒有可用的例句';

      document.getElementById('translation').value = translationText;
      document.getElementById('partOfSpeech').value = partOfSpeech;
      document.getElementById('exampleSentence').value = exampleSentence;

      const rootAnalysis = origin
        ? `字根/詞源線索：${origin}. 可延伸觀察詞綴與來源語意。`
        : '字根分析：可先觀察詞首、詞尾與常見詞綴，並搭配例句記憶。';
      document.getElementById('rootAnalysis').value = rootAnalysis;

      setStatus('已自動填入翻譯、詞性、例句與字根分析。');
    } catch (error) {
      console.error(error);
      document.getElementById('translation').value = 'API 讀取失敗，請手動補充';
      document.getElementById('partOfSpeech').value = 'unknown';
      document.getElementById('exampleSentence').value = '請手動輸入範例句';
      document.getElementById('rootAnalysis').value = 'API 讀取失敗，可手動補充字根與詞綴分析。';
      setStatus('自動填入失敗，已回到手動補充模式。', 'error');
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (!window.confirm('確定要清空所有單字嗎？')) return;
    saveWords([]);
    renderWordList();
    setStatus('詞庫已清空。');
    window.dispatchEvent(new Event('storage'));
  });

  renderWordList();
}

if (document.location.pathname.includes('manage.html')) {
  initManagePage();
} else {
  initStudyPage();
}
