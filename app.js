// ===== STATE =====
let currentReciter = RECITERS[61]; // السديس افتراضي
let currentSurahIndex = 0;
let isPlaying = false;
let isRepeat = false;
let isAutoplay = true;
let botOpen = false;
let botLoading = false;
const audio = document.getElementById('audioPlayer');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  renderReciters(RECITERS);
  renderSurahs(SURAHS);
  setupAudio();
  // تحديد السديس كقارئ افتراضي
  selectReciter(currentReciter, document.querySelector('.reciter-card'));
});

// ===== RENDER RECITERS =====
function renderReciters(list) {
  const grid = document.getElementById('reciterGrid');
  grid.innerHTML = list.map((r, i) => `
    <div class="reciter-card" data-id="${r.id}" onclick="selectReciter(RECITERS.find(x=>x.id==='${r.id}'), this)">
      <div class="reciter-avatar">🎙️</div>
      <div class="reciter-name">${r.name}</div>
      <div class="reciter-type">${r.type}</div>
    </div>
  `).join('');
}

// ===== RENDER SURAHS =====
function renderSurahs(list) {
  const grid = document.getElementById('surahsGrid');
  grid.innerHTML = list.map(s => `
    <div class="surah-card" data-n="${s.n}" onclick="selectSurah(${s.n - 1}, this)">
      <div class="surah-num">${s.n}</div>
      <div class="surah-info">
        <div class="surah-name">${s.name}</div>
        <div class="surah-meta">${s.verses} آية · ${s.type}</div>
      </div>
    </div>
  `).join('');
}

// ===== SELECT RECITER =====
function selectReciter(reciter, el) {
  if (!reciter) return;
  currentReciter = reciter;
  document.querySelectorAll('.reciter-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const card = document.querySelector(`.reciter-card[data-id="${reciter.id}"]`);
    if (card) card.classList.add('active');
  }
  document.getElementById('playerReciterName').textContent = reciter.name;
  // إعادة تحميل السورة الحالية بالقارئ الجديد
  loadSurah(currentSurahIndex, false);
}

// ===== SELECT SURAH =====
function selectSurah(idx, el) {
  currentSurahIndex = idx;
  document.querySelectorAll('.surah-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const card = document.querySelector(`.surah-card[data-n="${idx + 1}"]`);
    if (card) card.classList.add('active');
  }
  loadSurah(idx, true);
  // scroll to player
  document.querySelector('.player-section').scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ===== LOAD SURAH =====
function loadSurah(idx, autoplay = true) {
  const surah = SURAHS[idx];
  if (!surah || !currentReciter) return;
  const url = getAudioUrl(currentReciter.id, surah.n);
  audio.src = url;
  audio.load();
  document.getElementById('playerSurahName').textContent = `سورة ${surah.name}`;
  document.getElementById('playerReciterName').textContent = currentReciter.name;
  document.getElementById('downloadBtn').href = url;
  document.getElementById('downloadBtn').download = `${surah.name}_${currentReciter.name}.mp3`;
  resetProgress();
  if (autoplay) {
    audio.play().then(() => { isPlaying = true; updatePlayBtn(); }).catch(() => {});
  }
}

// ===== AUDIO SETUP =====
function setupAudio() {
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').textContent = formatTime(audio.duration);
  });
  audio.addEventListener('ended', () => {
    if (isRepeat) { audio.play(); return; }
    if (isAutoplay) nextSurah();
    else { isPlaying = false; updatePlayBtn(); }
  });
  audio.addEventListener('play', () => { isPlaying = true; updatePlayBtn(); });
  audio.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });
  audio.addEventListener('error', () => {
    // بعض السور قد لا تكون متاحة لبعض القراء
  });
}

function updateProgress() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
}

function resetProgress() {
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('currentTime').textContent = '0:00';
  document.getElementById('totalTime').textContent = '0:00';
}

function seekAudio(e) {
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = x / rect.width;
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ===== CONTROLS =====
function togglePlay() {
  if (!audio.src) {
    selectSurah(0);
    return;
  }
  if (isPlaying) audio.pause();
  else audio.play().catch(() => {});
}

function updatePlayBtn() {
  document.getElementById('playBtn').textContent = isPlaying ? '⏸️' : '▶️';
}

function nextSurah() {
  if (currentSurahIndex < SURAHS.length - 1) {
    selectSurah(currentSurahIndex + 1);
  }
}

function prevSurah() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (currentSurahIndex > 0) selectSurah(currentSurahIndex - 1);
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  document.getElementById('repeatBtn').classList.toggle('active', isRepeat);
}

function toggleAutoplay() {
  isAutoplay = !isAutoplay;
  document.getElementById('autoplayBtn').classList.toggle('active', isAutoplay);
}

function changeSpeed(val) {
  audio.playbackRate = parseFloat(val);
}

// ===== SEARCH TABS =====
document.querySelectorAll('.search-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.search-box').forEach(b => b.classList.add('hidden'));
    document.getElementById('search-' + tab.dataset.tab).classList.remove('hidden');
  });
});

// ===== FILTER SURAHS =====
function filterSurahs(q) {
  const filtered = q
    ? SURAHS.filter(s => s.name.includes(q) || String(s.n).includes(q) || s.en.toLowerCase().includes(q.toLowerCase()))
    : SURAHS;
  renderSurahs(filtered);
}

// ===== FILTER RECITERS =====
function filterReciters(q) {
  const filtered = q ? RECITERS.filter(r => r.name.includes(q)) : RECITERS;
  renderReciters(filtered);
  if (currentReciter) {
    const card = document.querySelector(`.reciter-card[data-id="${currentReciter.id}"]`);
    if (card) card.classList.add('active');
  }
}

function filterReciterCards(q) {
  const filtered = q ? RECITERS.filter(r => r.name.includes(q)) : RECITERS;
  renderReciters(filtered);
  if (currentReciter) {
    const card = document.querySelector(`.reciter-card[data-id="${currentReciter.id}"]`);
    if (card) card.classList.add('active');
  }
}

// ===== VERSE SEARCH =====
async function searchVerse() {
  const surah = document.getElementById('verseSearchSurah').value;
  const ayah = document.getElementById('verseSearchAyah').value;
  const resultEl = document.getElementById('verseResult');
  if (!surah || !ayah) { resultEl.textContent = 'الرجاء إدخال رقم السورة والآية'; resultEl.classList.remove('hidden'); return; }
  resultEl.textContent = '⏳ جاري البحث...';
  resultEl.classList.remove('hidden');
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`);
    const data = await res.json();
    if (data.status === 'OK') {
      const ayahData = data.data;
      resultEl.innerHTML = `
        <div style="margin-bottom:8px;font-size:0.85rem;color:var(--text-secondary);">سورة ${ayahData.surah.name} - آية ${ayahData.numberInSurah}</div>
        <div style="font-size:1.6rem;line-height:2.2;">${ayahData.text}</div>
        <div style="margin-top:12px;">
          <button class="btn-primary" onclick="playVerseAudio('${ayahData.audio}')" style="font-size:0.85rem;padding:8px 16px;">▶ استمع للآية</button>
        </div>
      `;
    } else {
      resultEl.textContent = 'لم يتم العثور على الآية، تأكد من الأرقام';
    }
  } catch {
    resultEl.textContent = 'حدث خطأ، تحقق من الاتصال بالإنترنت';
  }
}

function playVerseAudio(url) {
  audio.src = url;
  audio.play().catch(() => {});
  document.getElementById('playerSurahName').textContent = 'تشغيل آية';
  document.getElementById('playerReciterName').textContent = 'من القرآن الكريم';
}

// ===== CHATBOT =====
function toggleBot() {
  botOpen = !botOpen;
  document.getElementById('botWindow').classList.toggle('open', botOpen);
}

function sendQuick(msg) {
  document.getElementById('botInput').value = msg;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('botInput');
  const msg = input.value.trim();
  if (!msg || botLoading) return;
  input.value = '';
  addUserMsg(msg);
  document.getElementById('quickReplies').style.display = 'none';
  botLoading = true;
  const typingId = addTyping();
  try {
    const reply = await askClaude(msg);
    removeTyping(typingId);
    addBotMsg(reply);
  } catch {
    removeTyping(typingId);
    addBotMsg('عذراً، حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.');
  }
  botLoading = false;
}

async function askClaude(question) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `أنت مساعد متخصص في القرآن الكريم والعلوم الإسلامية على موقع القرآن الكريم.
مهامك:
1. الإجابة على أسئلة القرآن والتفسير والعلوم الإسلامية بدقة واحترام
2. مساعدة المستخدمين في التعامل مع الموقع (البحث عن سور وقراء، الاستماع، التحميل)
3. الترحيب بالزوار الجدد بشكل دافئ
قواعد مهمة:
- الإجابات مختصرة ومفيدة (3-5 أسطر كحد أقصى في الغالب)
- استخدم الأسلوب الإسلامي الراقي
- لا تتحدث في مواضيع خارج القرآن والإسلام إطلاقاً
- إذا سُئلت عن شيء خارج اختصاصك قل: "هذا خارج اختصاصي، يسعدني مساعدتك في أسئلة القرآن الكريم"
- تحقق دائماً من صحة المعلومات الدينية قبل الإجابة
- ابدأ كل إجابة بتعبير مناسب مثل: بارك الله فيك، جزاك الله خيراً، إلخ
الموقع يحتوي على: 114 سورة، أكثر من 150 قارئاً، بحث بالآية والسورة والقارئ`,
      messages: [{ role: 'user', content: question }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}

function addUserMsg(text) {
  const msgs = document.getElementById('botMessages');
  msgs.innerHTML += `<div class="user-msg"><div class="msg-avatar">👤</div><div class="msg-bubble">${escHtml(text)}</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
}

function addBotMsg(text) {
  const msgs = document.getElementById('botMessages');
  msgs.innerHTML += `<div class="bot-msg"><div class="msg-avatar">🕌</div><div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  const msgs = document.getElementById('botMessages');
  const id = 'typing_' + Date.now();
  msgs.innerHTML += `<div class="bot-msg" id="${id}"><div class="msg-avatar">🕌</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== CHANNEL TRACKING =====
function trackChannel(name) {
  // يمكن إضافة analytics هنا
  console.log('Channel clicked:', name);
}
