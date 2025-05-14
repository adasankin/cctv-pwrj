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
  // ===== Smooth Scrolling + Offcanvas Hide =====
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
  ];

  const purworejoCenter = [-7.7131, 110.0146];
  const map = L.map('map').setView(purworejoCenter, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Marker icon
  const cctvIcon = L.icon({
    iconUrl: 'https://pelindung.bandung.go.id/static/media/pin.57eb90b3f5608d64becc.png', //ganti
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
          <p>${location.description}</p>
          <button class="btn btn-sm btn-primary mt-2 view-stream-btn" data-id="${location.id}">
            <i class="fas fa-video me-1"></i> Lihat Stream
          </button>
        </div>
      `);
    
    marker.on('popupopen', function() {
      document.querySelectorAll('.view-stream-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          openVideoModal(id);
        });
      });
    });
    
    markers[location.id] = marker;
  });

  // Map controls
  document.getElementById('zoomIn').addEventListener('click', function() {
    map.zoomIn();
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    map.zoomOut();
  });

  document.getElementById('recenter').addEventListener('click', function() {
    map.setView(purworejoCenter, 13);
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
    { id: 1, title: "CCTV ROMANSA PURWOREJO", location: "Romansa Kuliner", type: "public", src: "DOOrIxw5xOw" },
    { id: 2, title: "CCTV BUH LIWUNG", location: "Jembatan Bogowonto", type: "traffic", src: "yNKvkPJl-tg" },
    { id: 3, title: "CCTV BATAS MAGELANG", location: "Tugu Perbatasan", type: "traffic", src: "cFK5o5OJx_E" },
    { id: 4, title: "CCTV JOGOBOYO", location: "Jl. Daendels", type: "traffic",  src: "dkwPqVIR4n4" },
    { id: 5, title: "CCTV STASIUN WOJO", location: "Jalan Nasional", type: "traffic", src: "j0sJjQhScCQ" },
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
              <img src="image.png" class="video-logo" alt="Logo">
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
    
    document.getElementById('modalTitle').textContent = video.title;
    document.getElementById('modalLocation').querySelector('span').textContent = video.location;
    
    // YouTube embed
    const videoFrame = document.getElementById('videoFrame');
    videoFrame.src = `https://www.youtube.com/embed/${video.src}?autoplay=1&controls=0&showinfo=0&rel=0&loop=0&wmode=transparent`;
    
    videoModal.show();
  }

  document.getElementById('videoModal').addEventListener('hidden.bs.modal', function() {
    document.getElementById('videoFrame').src = '';
  });
});