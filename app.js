/**
 * RescuePets - Main Application Logic
 * Vanilla JavaScript (ES6+) - Public Data Portal API (abandonmentPublicService_v2) Integration
 * Deduplication & Dynamic Species Image Fallback Fix Applied
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Public API Configuration ---
  const PUBLIC_API_BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2';
  const PUBLIC_API_KEY = 'c1bd777b53bd678a6679c96a44958d2f0851aa1d57ac954e4a1907b04c5bc086';

  // --- Fallback Image Pool for Diverse & Species-matched Image Replacement ---
  const FALLBACK_IMAGES = {
    dog: [
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80",
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&q=80",
      "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=600&q=80",
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80",
      "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80",
      "https://images.unsplash.com/photo-1591769225440-811ad7d6eca2?w=600&q=80",
      "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&q=80",
      "https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=600&q=80"
    ],
    cat: [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80",
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80",
      "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600&q=80",
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&q=80",
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80",
      "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600&q=80",
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&q=80"
    ],
    other: [
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&q=80",
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80",
      "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&q=80"
    ]
  };

  function getFallbackImage(species, seedString = '') {
    const pool = FALLBACK_IMAGES[species] || FALLBACK_IMAGES.dog;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = (hash << 5) - hash + seedString.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % pool.length;
    return pool[idx];
  }

  // --- State Initialization ---
  let dataMode = 'api'; // 'api' or 'mock'
  let petsData = [];
  let favoriteIds = new Set(JSON.parse(localStorage.getItem('rescuepets_favorites') || '[]'));
  let activeTab = 'all'; // 'all', 'favorites', 'dashboard'
  
  const currentFilters = {
    search: '',
    species: 'all',
    state: 'all',
    sort: 'recent'
  };

  let activeModalPetId = null;

  // --- DOM Elements Reference ---
  const petGrid = document.getElementById('petGrid');
  const emptyState = document.getElementById('emptyState');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const displayedCountEl = document.getElementById('displayedCount');

  // Search & Filter Inputs
  const searchInput = document.getElementById('searchInput');
  const speciesFilter = document.getElementById('speciesFilter');
  const stateFilter = document.getElementById('stateFilter');
  const sortFilter = document.getElementById('sortFilter');
  const btnResetFilter = document.getElementById('btnResetFilter');
  const filterTagsRow = document.getElementById('filterTagsRow');
  const activePillsContainer = document.getElementById('activePillsContainer');

  // Nav Controls & Badges
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const btnToggleApiMode = document.getElementById('btnToggleApiMode');
  const dataSourceLabel = document.getElementById('dataSourceLabel');
  const btnRefreshApi = document.getElementById('btnRefreshApi');

  // Tabs
  const tabAll = document.getElementById('tabAll');
  const tabFav = document.getElementById('tabFav');
  const tabDash = document.getElementById('tabDash');
  const btnOpenQuizTab = document.getElementById('btnOpenQuizTab');
  const favCountBadge = document.getElementById('favCountBadge');

  // Views & Sections
  const dashboardSection = document.getElementById('dashboardSection');
  const filterSection = document.getElementById('filterSection');

  // Hero Stats
  const heroProtectingCount = document.getElementById('heroProtectingCount');
  const heroAdoptedCount = document.getElementById('heroAdoptedCount');

  // Dashboard Stats
  const dashTotalNum = document.getElementById('dashTotalNum');
  const dashUrgentNum = document.getElementById('dashUrgentNum');
  const dashRateNum = document.getElementById('dashRateNum');
  const dashDogPct = document.getElementById('dashDogPct');
  const dashCatPct = document.getElementById('dashCatPct');
  const dashOtherPct = document.getElementById('dashOtherPct');
  const dashSpeciesBar = document.getElementById('dashSpeciesBar');

  // Animal Detail Modal Elements
  const animalModal = document.getElementById('animalModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalNoticeNo = document.getElementById('modalNoticeNo');
  const modalTitle = document.getElementById('modalTitle');
  const modalGender = document.getElementById('modalGender');
  const modalAgeWeight = document.getElementById('modalAgeWeight');
  const modalHappenDate = document.getElementById('modalHappenDate');
  const modalNoticeEndDate = document.getElementById('modalNoticeEndDate');
  const modalHappenPlace = document.getElementById('modalHappenPlace');
  const modalShelterName = document.getElementById('modalShelterName');
  const modalShelterTel = document.getElementById('modalShelterTel');
  const modalCharacteristics = document.getElementById('modalCharacteristics');
  const modalFavBtn = document.getElementById('modalFavBtn');
  const btnCallShelter = document.getElementById('btnCallShelter');
  const btnShareModal = document.getElementById('btnShareModal');

  // Quiz Modal Elements
  const quizModal = document.getElementById('quizModal');
  const quizCloseBtn = document.getElementById('quizCloseBtn');
  const quizProgressBar = document.getElementById('quizProgressBar');
  const quizQNum = document.getElementById('quizQNum');
  const quizQText = document.getElementById('quizQText');
  const quizOptions = document.getElementById('quizOptions');
  const quizQuestionBox = document.getElementById('quizQuestionBox');
  const quizResult = document.getElementById('quizResult');
  const quizScoreText = document.getElementById('quizScoreText');
  const quizResultTitle = document.getElementById('quizResultTitle');
  const quizResultDesc = document.getElementById('quizResultDesc');
  const btnRestartQuiz = document.getElementById('btnRestartQuiz');

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toastContainer = document.getElementById('toastContainer');

  // --- Utility Functions ---

  // Date D-Day Calculation relative to today's date
  function getDDay(endDateStr, state) {
    if (state === 'adopted') {
      return { label: '입양완료', diff: 999, class: 'adopted' };
    }
    if (!endDateStr) return { label: '보호중', diff: 99, class: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) return { label: '보호중', diff: 99, class: '' };

    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: '공고종료', diff: diffDays, class: '' };
    } else if (diffDays === 0) {
      return { label: 'D-Day 오늘마감', diff: 0, class: 'urgent' };
    } else if (diffDays <= 3) {
      return { label: `D-${diffDays} (임박)`, diff: diffDays, class: 'urgent' };
    } else if (diffDays <= 6) {
      return { label: `D-${diffDays}`, diff: diffDays, class: 'warning' };
    } else {
      return { label: `D-${diffDays}`, diff: diffDays, class: '' };
    }
  }

  // Toast Notification Trigger
  function showToast(message, icon = '✨') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Update Favorite LocalStorage
  function saveFavorites() {
    localStorage.setItem('rescuepets_favorites', JSON.stringify([...favoriteIds]));
    favCountBadge.textContent = favoriteIds.size;
  }

  function toggleFavorite(id) {
    if (favoriteIds.has(id)) {
      favoriteIds.delete(id);
      showToast('관심 동물 목록에서 제외되었습니다.', '💔');
    } else {
      favoriteIds.add(id);
      showToast('관심 동물에 등록되었습니다!', '❤️');
    }
    saveFavorites();
    render();

    if (activeModalPetId === id) {
      modalFavBtn.classList.toggle('active', favoriteIds.has(id));
    }
  }

  // --- Public API Item Data Transformer ---
  function transformApiItemToPet(item, index) {
    let species = 'other';
    let breed = item.kindCd || '미상';

    if (breed.includes('[개]') || breed.includes('개')) {
      species = 'dog';
      breed = breed.replace('[개]', '').trim();
    } else if (breed.includes('[고양이]') || breed.includes('고양이')) {
      species = 'cat';
      breed = breed.replace('[고양이]', '').trim();
    } else if (breed.includes('[기타축종]')) {
      breed = breed.replace('[기타축종]', '').trim();
    }

    // Gender & Neuter Status
    let genderStr = item.sexCd === 'M' ? '수컷' : item.sexCd === 'F' ? '암컷' : '성별미상';
    if (item.neuterYn === 'Y') genderStr += '(중성화O)';
    else if (item.neuterYn === 'N') genderStr += '(중성화X)';

    // Date Format: YYYYMMDD -> YYYY-MM-DD
    function formatDate(dStr) {
      if (!dStr || String(dStr).length !== 8) return dStr || '';
      const s = String(dStr);
      return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
    }

    // Process State
    let noticeState = 'protecting';
    if (item.processState && (item.processState.includes('입양') || item.processState.includes('종료') || item.processState.includes('자연사') || item.processState.includes('안락사'))) {
      noticeState = 'adopted';
    }

    // Image URL Cleanup (Upgrade http to https or fallback)
    let imageUrl = item.popfile || item.filename || '';
    if (typeof imageUrl === 'string' && imageUrl.startsWith('http://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }
    if (!imageUrl || imageUrl.trim() === '') {
      imageUrl = getFallbackImage(species, item.desertionNo || item.noticeNo || breed);
    }

    const petId = item.desertionNo ? `API-${item.desertionNo}` : `API-${index}`;

    return {
      id: petId,
      noticeNo: item.noticeNo || `공고-${item.desertionNo || index}`,
      species: species,
      breed: breed || '믹스',
      gender: genderStr,
      age: item.age || '나이 미상',
      weight: item.weight || '체중 미상',
      happenDate: formatDate(item.happenDt),
      happenPlace: item.happenPlace || '발견 장소 미상',
      noticeState: noticeState,
      noticeEndDate: formatDate(item.noticeEdt),
      imageUrl: imageUrl,
      characteristics: item.specialMark || '특이사항 없음',
      shelterName: item.careNm || '지정 동물보호센터',
      shelterTel: item.careTel || '보호소 연락처 참조',
      healthStatus: item.colorCd ? `색상: ${item.colorCd}` : '기초 신체검사 완료'
    };
  }

  // --- Fetch Data from Public API (With Deduplication) ---
  async function fetchPublicApiData() {
    loadingIndicator.style.display = 'block';
    petGrid.style.display = 'none';
    emptyState.style.display = 'none';

    // Build URL with serviceKey
    const apiUrl = `${PUBLIC_API_BASE_URL}?serviceKey=${PUBLIC_API_KEY}&numOfRows=60&pageNo=1&_type=json`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const json = await response.json();
      const itemsContainer = json?.response?.body?.items?.item;

      let itemsArray = [];
      if (Array.isArray(itemsContainer)) {
        itemsArray = itemsContainer;
      } else if (itemsContainer && typeof itemsContainer === 'object') {
        itemsArray = [itemsContainer];
      }

      if (itemsArray.length > 0) {
        // --- DEDUPLICATION LOGIC ---
        const seenKeys = new Set();
        const uniqueItems = [];

        itemsArray.forEach(item => {
          const uniqueKey = item.desertionNo || item.noticeNo || (item.happenDt + '_' + item.kindCd + '_' + item.happenPlace);
          if (!seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            uniqueItems.push(item);
          }
        });

        petsData = uniqueItems.map((item, idx) => transformApiItemToPet(item, idx));
        dataMode = 'api';
        apiStatusBadge.textContent = '🟢 실시간 공공 API 연동';
        dataSourceLabel.textContent = '공공 API 모드';
        showToast(`공공데이터포털 실시간 데이터 ${petsData.length}건을 로딩하였습니다! (중복 제거 완료)`, '🌐');
      } else {
        throw new Error('API 응답에 데이터 항목이 없습니다.');
      }
    } catch (error) {
      console.warn('Public API Fetch Failed, fallback to Mock Data:', error);
      petsData = Array.isArray(MOCK_PETS) ? [...MOCK_PETS] : [];
      dataMode = 'mock';
      apiStatusBadge.textContent = '🟡 내장 데이터 모드';
      dataSourceLabel.textContent = '내장 샘플 모드';
      showToast('공공 API 연동 실패로 내장 시뮬레이션 데이터로 전환되었습니다.', '⚠️');
    } finally {
      loadingIndicator.style.display = 'none';
      petGrid.style.display = 'grid';
      render();
    }
  }

  // Use Mock Data explicitly
  function loadMockData() {
    petsData = Array.isArray(MOCK_PETS) ? [...MOCK_PETS] : [];
    dataMode = 'mock';
    apiStatusBadge.textContent = '🟡 내장 데이터 모드';
    dataSourceLabel.textContent = '내장 샘플 모드';
    showToast('내장 가상 샘플 데이터 20건을 불러왔습니다.', '📦');
    render();
  }

  // --- Filtering & Sorting Logic ---
  function getFilteredPets() {
    return petsData.filter(pet => {
      // Favorites tab check
      if (activeTab === 'favorites' && !favoriteIds.has(pet.id)) {
        return false;
      }

      // Species filter
      if (currentFilters.species !== 'all' && pet.species !== currentFilters.species) {
        return false;
      }

      // Notice State filter
      if (currentFilters.state !== 'all' && pet.noticeState !== currentFilters.state) {
        return false;
      }

      // Search query filter
      if (currentFilters.search.trim() !== '') {
        const q = currentFilters.search.toLowerCase();
        const matchBreed = pet.breed.toLowerCase().includes(q);
        const matchPlace = pet.happenPlace.toLowerCase().includes(q);
        const matchChar = pet.characteristics.toLowerCase().includes(q);
        const matchNotice = pet.noticeNo.toLowerCase().includes(q);
        const matchShelter = pet.shelterName.toLowerCase().includes(q);
        if (!matchBreed && !matchPlace && !matchChar && !matchNotice && !matchShelter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (currentFilters.sort === 'urgent') {
        const dDayA = getDDay(a.noticeEndDate, a.noticeState).diff;
        const dDayB = getDDay(b.noticeEndDate, b.noticeState).diff;
        return dDayA - dDayB;
      } else if (currentFilters.sort === 'oldest') {
        return new Date(a.happenDate) - new Date(b.happenDate);
      } else {
        // 'recent' default
        return new Date(b.happenDate) - new Date(a.happenDate);
      }
    });
  }

  // --- Render Cards Grid ---
  function renderCards(filtered) {
    petGrid.innerHTML = '';
    displayedCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    filtered.forEach(pet => {
      const dDayInfo = getDDay(pet.noticeEndDate, pet.noticeState);
      const isFav = favoriteIds.has(pet.id);
      const fallbackSrc = getFallbackImage(pet.species, pet.id);

      const card = document.createElement('div');
      card.className = 'pet-card';
      card.innerHTML = `
        <div class="card-img-container">
          <img src="${pet.imageUrl}" alt="${pet.breed}" class="pet-img" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
          <span class="badge-dday ${dDayInfo.class}">${dDayInfo.label}</span>
          <span class="badge-status ${pet.noticeState}">${pet.noticeState === 'protecting' ? '보호중' : '입양완료'}</span>
          <button class="btn-fav ${isFav ? 'active' : ''}" data-id="${pet.id}" title="찜하기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <div class="card-body">
          <div class="notice-no">${pet.noticeNo}</div>
          <h3 class="pet-title">${pet.breed}</h3>
          <div class="pet-details-list">
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${pet.gender} • ${pet.age}
            </div>
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${pet.happenPlace}
            </div>
          </div>
          <div class="pet-tags">
            <span class="tag">⚖️ ${pet.weight}</span>
            <span class="tag">🏥 ${pet.healthStatus.split(',')[0]}</span>
          </div>
        </div>
      `;

      // Event listener for favorite toggle button inside card
      const favBtn = card.querySelector('.btn-fav');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(pet.id);
      });

      // Open detail modal when clicking card body
      card.addEventListener('click', () => {
        openDetailModal(pet);
      });

      petGrid.appendChild(card);
    });
  }

  // --- Render Active Filter Pills ---
  function renderFilterPills() {
    activePillsContainer.innerHTML = '';
    let hasPill = false;

    if (currentFilters.search.trim()) {
      hasPill = true;
      activePillsContainer.appendChild(createPill(`검색어: "${currentFilters.search}"`, () => {
        currentFilters.search = '';
        searchInput.value = '';
        render();
      }));
    }

    if (currentFilters.species !== 'all') {
      hasPill = true;
      const speciesNameMap = { dog: '개', cat: '고양이', other: '기타' };
      activePillsContainer.appendChild(createPill(`축종: ${speciesNameMap[currentFilters.species]}`, () => {
        currentFilters.species = 'all';
        speciesFilter.value = 'all';
        render();
      }));
    }

    if (currentFilters.state !== 'all') {
      hasPill = true;
      const stateNameMap = { protecting: '보호중', adopted: '입양완료' };
      activePillsContainer.appendChild(createPill(`상태: ${stateNameMap[currentFilters.state]}`, () => {
        currentFilters.state = 'all';
        stateFilter.value = 'all';
        render();
      }));
    }

    filterTagsRow.style.display = hasPill ? 'flex' : 'none';
  }

  function createPill(text, onRemove) {
    const pill = document.createElement('span');
    pill.className = 'filter-pill';
    pill.innerHTML = `${text} <span class="filter-pill-remove">&times;</span>`;
    pill.querySelector('.filter-pill-remove').addEventListener('click', onRemove);
    return pill;
  }

  // --- Update Dashboard Stats & Hero Counter ---
  function updateDashboardStats() {
    const total = petsData.length;
    const protecting = petsData.filter(p => p.noticeState === 'protecting').length;
    const adopted = petsData.filter(p => p.noticeState === 'adopted').length;
    
    // Urgent count (D-3 or less)
    const urgent = petsData.filter(p => p.noticeState === 'protecting' && getDDay(p.noticeEndDate, p.noticeState).diff <= 3).length;

    // Species counts
    const dogs = petsData.filter(p => p.species === 'dog').length;
    const cats = petsData.filter(p => p.species === 'cat').length;
    const others = petsData.filter(p => p.species === 'other').length;

    const dogPct = Math.round((dogs / total) * 100) || 0;
    const catPct = Math.round((cats / total) * 100) || 0;
    const otherPct = 100 - (dogPct + catPct);

    const adoptionRate = Math.round((adopted / total) * 100) || 0;

    // Update Hero elements
    heroProtectingCount.textContent = `${protecting}마리`;
    heroAdoptedCount.textContent = `${adopted}마리`;

    // Update Dashboard Elements
    dashTotalNum.textContent = `${total}건`;
    dashUrgentNum.textContent = `${urgent}마리`;
    dashRateNum.textContent = `${adoptionRate}%`;

    dashDogPct.textContent = dogPct;
    dashCatPct.textContent = catPct;
    dashOtherPct.textContent = otherPct;

    const segments = dashSpeciesBar.querySelectorAll('.bar-segment');
    if (segments.length >= 3) {
      segments[0].style.width = `${dogPct}%`;
      segments[1].style.width = `${catPct}%`;
      segments[2].style.width = `${otherPct}%`;
    }
  }

  // --- Main Master Render Loop ---
  function render() {
    saveFavorites();
    const filtered = getFilteredPets();
    renderCards(filtered);
    renderFilterPills();
    updateDashboardStats();
  }

  // --- Detail Modal Control ---
  function openDetailModal(pet) {
    activeModalPetId = pet.id;
    const dDayInfo = getDDay(pet.noticeEndDate, pet.noticeState);

    modalImg.src = pet.imageUrl;
    modalImg.onerror = function() {
      this.onerror = null;
      this.src = getFallbackImage(pet.species, pet.id);
    };

    modalNoticeNo.textContent = `${pet.noticeNo} • ${dDayInfo.label}`;
    modalTitle.textContent = `${pet.breed} (${pet.species === 'dog' ? '강아지' : pet.species === 'cat' ? '고양이' : '소동물'})`;
    modalGender.textContent = pet.gender;
    modalAgeWeight.textContent = `${pet.age} / ${pet.weight}`;
    modalHappenDate.textContent = pet.happenDate;
    modalNoticeEndDate.textContent = pet.noticeEndDate || '상시';
    modalHappenPlace.textContent = pet.happenPlace;
    modalShelterName.textContent = pet.shelterName;
    modalShelterTel.textContent = pet.shelterTel;
    modalCharacteristics.textContent = `${pet.characteristics} (건강소견: ${pet.healthStatus})`;

    // Tel link setup
    btnCallShelter.href = `tel:${pet.shelterTel}`;
    btnCallShelter.onclick = () => {
      showToast(`${pet.shelterName} (${pet.shelterTel})로 연결합니다.`, '📞');
    };

    // Modal favorite button state
    modalFavBtn.classList.toggle('active', favoriteIds.has(pet.id));

    animalModal.classList.add('active');
  }

  function closeDetailModal() {
    animalModal.classList.remove('active');
    activeModalPetId = null;
  }

  modalCloseBtn.addEventListener('click', closeDetailModal);
  animalModal.addEventListener('click', (e) => {
    if (e.target === animalModal) closeDetailModal();
  });

  modalFavBtn.addEventListener('click', () => {
    if (activeModalPetId) {
      toggleFavorite(activeModalPetId);
    }
  });

  btnShareModal.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('공고 링크가 클립보드에 복사되었습니다!', '🔗');
    } else {
      showToast('링크 복사 기능이 지원됩니다.', '🔗');
    }
  });

  // --- Adoption Quiz Logic ---
  const quizQuestions = [
    {
      q: "1. 주거 환경에서 반려동물 양육이 완전히 허용되나요?",
      options: [
        { text: "네, 자가/전세이며 가족/동의를 마쳤습니다.", score: 20 },
        { text: "임대인/가족과의 조율이 일부 더 필요합니다.", score: 10 }
      ]
    },
    {
      q: "2. 월 평균 양육비(사료, 모래, 예방접종, 의료비 등 10~20만원) 감당이 가능하신가요?",
      options: [
        { text: "네, 비상 시 의료비 전용 저축도 가능합니다.", score: 20 },
        { text: "약간 부담스럽지만 아껴서 관리할 수 있습니다.", score: 10 }
      ]
    },
    {
      q: "3. 매일 최소 30분~1시간 이상의 산책, 놀이, 돌봄 시간을 낼 수 있나요?",
      options: [
        { text: "네, 매일 규칙적인 시간을 낼 준비가 되었습니다.", score: 20 },
        { text: "일이 바빠 주말 위주로 돌볼 것 같습니다.", score: 10 }
      ]
    },
    {
      q: "4. 장기 여행이나 출장 시 반려동물을 케어할 대안(돌봄/호텔 등)이 있나요?",
      options: [
        { text: "네, 믿을 수 있는 펫시터나 보호자가 있습니다.", score: 20 },
        { text: "아직 구체적인 대안은 없습니다.", score: 5 }
      ]
    },
    {
      q: "5. 아이가 무지개다리를 건널 때까지(15년 이상) 평생 책임질 마음이 있으신가요?",
      options: [
        { text: "어떠한 상황에서도 끝까지 평생 함께하겠습니다!", score: 20 },
        { text: "노령견/묘 케어에 대해 걱정이 듭니다.", score: 10 }
      ]
    }
  ];

  let currentQuizIndex = 0;
  let quizTotalScore = 0;

  function startQuiz() {
    currentQuizIndex = 0;
    quizTotalScore = 0;
    quizQuestionBox.style.display = 'block';
    quizResult.style.display = 'none';
    renderQuizQuestion();
    quizModal.classList.add('active');
  }

  function renderQuizQuestion() {
    const qData = quizQuestions[currentQuizIndex];
    quizQNum.textContent = `질문 ${currentQuizIndex + 1} / ${quizQuestions.length}`;
    quizQText.textContent = qData.q;
    quizProgressBar.style.width = `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`;

    quizOptions.innerHTML = '';
    qData.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        quizTotalScore += opt.score;
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
          renderQuizQuestion();
        } else {
          showQuizResult();
        }
      });
      quizOptions.appendChild(btn);
    });
  }

  function showQuizResult() {
    quizQuestionBox.style.display = 'none';
    quizResult.style.display = 'block';
    quizScoreText.textContent = `${quizTotalScore}점`;

    if (quizTotalScore >= 90) {
      quizResultTitle.textContent = "🏆 준비도 100%! 완벽한 보호자입니다";
      quizResultDesc.textContent = "책임감 있는 환경과 헌신적인 태도를 갖추셨습니다. 사랑스러운 아이들에게 따뜻한 집을 선물해주세요!";
    } else if (quizTotalScore >= 60) {
      quizResultTitle.textContent = "🌱 좋은 보호자가 될 준비 중입니다";
      quizResultDesc.textContent = "기본적인 준비가 잘 되어 계십니다. 약간의 환경적 고려(의료비 및 케어 시간)를 조금 더 점검해보세요.";
    } else {
      quizResultTitle.textContent = "💡 조금 더 신중한 준비가 필요합니다";
      quizResultDesc.textContent = "반려동물 입양은 15년 이상의 긴 책임이 뒤따릅니다. 자가진단 항목을 재점검하신 후 입양을 고려해보세요.";
    }
  }

  btnOpenQuizTab.addEventListener('click', startQuiz);
  btnRestartQuiz.addEventListener('click', startQuiz);
  quizCloseBtn.addEventListener('click', () => {
    quizModal.classList.remove('active');
  });

  // --- Data Source Mode Toggle Listener ---
  btnToggleApiMode.addEventListener('click', () => {
    if (dataMode === 'mock') {
      fetchPublicApiData();
    } else {
      loadMockData();
    }
  });

  btnRefreshApi.addEventListener('click', () => {
    fetchPublicApiData();
  });

  // --- Filter Event Listeners ---
  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    render();
  });

  speciesFilter.addEventListener('change', (e) => {
    currentFilters.species = e.target.value;
    render();
  });

  stateFilter.addEventListener('change', (e) => {
    currentFilters.state = e.target.value;
    render();
  });

  sortFilter.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    render();
  });

  btnResetFilter.addEventListener('click', () => {
    currentFilters.search = '';
    currentFilters.species = 'all';
    currentFilters.state = 'all';
    currentFilters.sort = 'recent';

    searchInput.value = '';
    speciesFilter.value = 'all';
    stateFilter.value = 'all';
    sortFilter.value = 'recent';

    render();
    showToast('검색 필터가 초기화되었습니다.', '🧹');
  });

  // --- Tab Navigation Listeners ---
  function setActiveTab(tab) {
    activeTab = tab;
    tabAll.classList.toggle('active', tab === 'all');
    tabFav.classList.toggle('active', tab === 'favorites');
    tabDash.classList.toggle('active', tab === 'dashboard');

    if (tab === 'dashboard') {
      dashboardSection.style.display = 'block';
      filterSection.style.display = 'none';
      petGrid.style.display = 'none';
      emptyState.style.display = 'none';
      document.querySelector('.cards-header').style.display = 'none';
    } else {
      dashboardSection.style.display = 'none';
      filterSection.style.display = 'block';
      petGrid.style.display = 'grid';
      document.querySelector('.cards-header').style.display = 'flex';
      render();
    }
  }

  tabAll.addEventListener('click', () => setActiveTab('all'));
  tabFav.addEventListener('click', () => setActiveTab('favorites'));
  tabDash.addEventListener('click', () => setActiveTab('dashboard'));

  // --- Theme Switcher Logic ---
  const savedTheme = localStorage.getItem('rescuepets_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rescuepets_theme', newTheme);
    showToast(`${newTheme === 'dark' ? '다크' : '라이트'} 모드로 전환되었습니다.`, newTheme === 'dark' ? '🌙' : '☀️');
  });

  // --- Keyboard Event ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      quizModal.classList.remove('active');
    }
  });

  // --- Initial Kickoff: Attempt Public API Load ---
  fetchPublicApiData();
});
