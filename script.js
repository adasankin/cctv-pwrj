document.addEventListener('DOMContentLoaded', function() {
  // ===== Navbar Scroll Effect =====
  const navbar = document.getElementById('mainNavbar');
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ===== Smooth Scrolling =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');

      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const navbarHeight = document.getElementById('mainNavbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Tutup offcanvas kalau terbuka
        const offcanvasEl = document.getElementById('offcanvasNavbar');
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (offcanvas) {
          offcanvas.hide();
        }
      }
    });
  });

  // ===== Peta =====
  const cctvLocations = [
    { id: 1, name: "Romansa Purworejo", lat: -7.714805623884854, lng: 110.00877946575973, type: "public", description: "Pantau aktivitas di pusat kota" },
    { id: 2, name: "Buh Liwung", lat: -7.716868590602795, lng: 110.02104629862569, type: "traffic", description: "Pemantauan area jembatan" },
    { id: 3, name: "Batas Magelang", lat: -7.576540676039513, lng: 110.07470796470817, type: "traffic", description: "Pantau arus lalu lintas utama" },
    { id: 4, name: "Jogoboyo", lat: -7.884068352807211, lng: 110.03425048477878, type: "traffic", description: "Jalan Raya Pos arah Jogja" },
    { id: 5, name: "Stasuin Wojo", lat: -7.862729119045524, lng: 110.0396328676768, type: "traffic", description: "Jalan protokol utama" },
  	{ id: 6, name: "Arta Tirta", lat: -7.862729119045524, lng: 110.0396328676768, type: "traffic", description: "Jalan protokol utama" },
  	{ id: 7, name: "Taman Bagelen", lat: -7.812006292278081, lng: 110.01721358440874, type: "traffic", description: "Pantau arus lalu lintas utama" },
  ];

  const purworejoCenter = [-7.716, 109.9699];
  const map = L.map('map', {zoomControl: false}).setView(purworejoCenter, 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Marker icon
  const cctvIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7400/7400432.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  // Add icon to map
  const markers = {};
  cctvLocations.forEach(location => {
    const marker = L.marker([location.lat, location.lng], { icon: cctvIcon })
      .addTo(map)
      .bindPopup(`
        <div class="popup-content">
          <h6>${location.name}</h6>
          <button class="btn btn-sm btn-primary mt-2 view-stream-btn" data-id="${location.id}">
            <i class="fas fa-video me-1"></i> Pantau Lokasi
          </button>
        </div>
      `);
    
    marker.on('popupopen', function() {
      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('view-stream-btn')) {
          const id = parseInt(e.target.getAttribute('data-id'));
          openVideoModal(id);
        }
      });
    });
    
    markers[location.id] = marker;
  });

  // Add pane from geojson
  map.createPane('kabupaten');
  map.getPane('kabupaten').style.zIndex = 400;

  fetch('purworejo.geojson')
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        pane: 'kabupaten',
        style: {
          color: '#2186d1',
          weight: 2,
          fillColor: '#399cdf',
          fillOpacity: 0.3,
          dashArray: '8 4'
        }
      }).addTo(map);
    })
  
  // Map controls
  document.getElementById('zoomIn').addEventListener('click', function() {
    map.zoomIn();
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    map.zoomOut();
  });

  document.getElementById('recenter').addEventListener('click', function() {
    map.setView(purworejoCenter, 11);
  });

  // ===== Populate Location List =====
  const locationListContainer = document.getElementById('locationList');

  function populateLocationList(locations) {
    locationListContainer.innerHTML = '';
    
    locations.forEach(location => {
      const locationItem = document.createElement('div');
      locationItem.className = 'location-item';
      locationItem.setAttribute('data-id', location.id);
      
      locationItem.innerHTML = `
        <h6>${location.name}</h6>
        <p><i class="fas fa-${location.type === 'traffic' ? 'road' : 'users'} me-1"></i> ${location.description}</p>
      `;
      
      locationItem.addEventListener('click', function() {
        const id = parseInt(this.getAttribute('data-id'));
        
        map.flyTo([location.lat, location.lng], 16);
        markers[id].openPopup();
        
        // Mobile Scroll
        if (window.innerWidth < 992) {
          document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      locationListContainer.appendChild(locationItem);
    });
  }

  populateLocationList(cctvLocations);

  // Location Search
  const locationSearch = document.getElementById('locationSearch');
  
  locationSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    const filteredLocations = cctvLocations.filter(location => 
      location.name.toLowerCase().includes(searchTerm) || 
      location.description.toLowerCase().includes(searchTerm)
    );
    
    populateLocationList(filteredLocations);
  });

  // ===== Video Streaming =====
  const videoData = [
    { id: 1, title: "CCTV ROMANSA PURWOREJO", location: "Jl. Proklamasi-Plaosan-Purworejo", type: "public", src: "48m_oFTx2co" },
    { id: 2, title: "CCTV BUH LIWUNG", location: "Jl. WR Supratman No.90-Tambakrejo-Purworejo", type: "traffic", src: "qF1PY4BUKAg" },
    { id: 3, title: "CCTV BATAS MAGELANG", location: "Kalijambe-Bener-Purworejo", type: "traffic",  src: "ZgWEZfYAI2g" },
  	{ id: 4, title: "CCTV JOGO BOYO", location: "Jl. Daendels-Congot-Jogoboyo", type: "traffic",  src: "C-NogB3LLkM" },
    { id: 5, title: "CCTV STASIUN WOJO", location: "Jl. Wates-Bagelen-Purworejo", type: "traffic", src: "OuMXkbHH_rE" },
	  { id: 6, title: "CCTV SIMPANG ARTA TIRTA", location: "Jl. Magelang-Purworejo", type: "traffic", src: "x-KzzPRzdxQ" },
    { id: 7, title: "CCTV TAMAN BAGELEN", location: "Jl. Bagelen - Cangkrep-Purworejo", type: "traffic", src: "3Xq0QoQtqHQ" },
  ];

  const videoList = document.getElementById('videoList');
  let currentFilter = 'all';
  let searchTerm = '';
  let displayCount = 6;

  function renderVideos() {
    videoList.innerHTML = '';
    
    let filteredVideos = videoData;
    
    if (currentFilter !== 'all') {
      filteredVideos = filteredVideos.filter(video => video.type === currentFilter);
    }
    
    if (searchTerm) {
      filteredVideos = filteredVideos.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        video.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const videosToDisplay = filteredVideos.slice(0, displayCount);
    
    videosToDisplay.forEach(video => {
      const videoCard = document.createElement('div');
      videoCard.className = 'col-md-6 col-lg-4 py-3';
      
      videoCard.innerHTML = `
        <div class="card h-100 video-card position-relative" data-id="${video.id}">
          <img src="https://img.youtube.com/vi/${video.src}/mqdefault.jpg" class="card-img-top" alt="${video.title}">
          <div class="card-body">
            <h5 class="card-title">${video.title}</h5>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <p class="card-text text-muted mb-0">${video.location}</p>
              <img src="assets/image.png" class="video-logo" alt="Logo">
            </div>
          </div>
        </div>
      `;
      
      videoCard.querySelector('.video-card').addEventListener('click', function() {
        const id = parseInt(this.getAttribute('data-id'));
        openVideoModal(id);
      });
      
      videoList.appendChild(videoCard);
    });
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (videosToDisplay.length < filteredVideos.length) {
      loadMoreBtn.style.display = 'inline-block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }

  renderVideos();

  // Filter 
  document.querySelectorAll('.stream-filter-card').forEach(filter => {
    filter.addEventListener('click', function() {
      document.querySelectorAll('.stream-filter-card').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
      
      currentFilter = this.getAttribute('data-filter');
      displayCount = 6;
      renderVideos();
    });
  });

  // CCTV Search
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', function() {
    searchTerm = this.value;
    displayCount = 6;
    renderVideos();
  });

  document.getElementById('loadMoreBtn').addEventListener('click', function() {
    displayCount += 6;
    renderVideos();
  });

  // ===== Video Modal =====
  const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
  
  function openVideoModal(id) {
    const video = videoData.find(v => v.id === id);
    
    if (!video) return;
    
    document.getElementById('modalTitle').innerHTML = `
      <span class="title-dot"></span>
      ${video.title}
    `;
    document.getElementById('modalLocation').querySelector('span').textContent = video.location;
    
    // YouTube embed
    const videoFrame = document.getElementById('videoFrame');
    videoFrame.src = `https://www.youtube-nocookie.com/embed/${video.src}?hd=1&autoplay=1&controls=0&fs=0&modestbranding=1&rel=0`;
    
    videoModal.show();
  }

  document.getElementById('videoModal').addEventListener('hidden.bs.modal', function() {
    document.getElementById('videoFrame').src = '';
  });

  // ===== Dark / Light Mode Toggle =====
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  themeToggle.addEventListener('click', function () {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  // === Scroll to Top ===
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 200);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ===== No Spy UI =====
  // document.addEventListener("contextmenu", function(event) {
  //   event.preventDefault();
  // });

  // document.addEventListener("keydown", function(event) {
  //   if (event.ctrlKey && (event.key === "u" || event.key === "i" || event.key === "j" || event.key === "c")) {
  //       event.preventDefault();
  //   }
  //   if (event.key === "F12") {
  //       event.preventDefault();
  //   }
  // });
});