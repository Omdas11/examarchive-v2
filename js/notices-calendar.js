/**
 * ExamArchive v2 — Notices & Calendar
 * Loads and displays notices and academic calendar with auto-scroll
 */

// Use relative path for local testing, will work on GitHub Pages too
const BASE_URL = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://omdas11.github.io/examarchive-v2';

/* ================= NOTICES ================= */
async function loadNotices() {
  const noticeBox = document.querySelector(".notice-box");
  if (!noticeBox) return;

  try {
    const res = await fetch(`${BASE_URL}/data/notices.json`);
    if (!res.ok) throw new Error("Failed to load notices");
    
    const notices = await res.json();
    
    if (!notices || notices.length === 0) {
      noticeBox.innerHTML = '<p class="notice-empty">No notices available at this time.</p>';
      return;
    }

    // Sort by date (newest first)
    notices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display notices
    noticeBox.innerHTML = '';
    notices.slice(0, 5).forEach(notice => {
      const item = document.createElement('div');
      item.className = 'notice-item';
      
      const priorityClass = notice.priority === 'high' ? 'priority-high' : '';
      
      item.innerHTML = `
        <div class="notice-header ${priorityClass}">
          <span class="notice-title">${notice.title}</span>
          <span class="notice-date">${formatDate(notice.date)}</span>
        </div>
        ${notice.description ? `<p class="notice-description">${notice.description}</p>` : ''}
        ${notice.pdf ? `<a href="${notice.pdf}" target="_blank" class="notice-link">View PDF →</a>` : ''}
      `;
      
      noticeBox.appendChild(item);
    });

  } catch (error) {
    console.error('Error loading notices:', error);
    noticeBox.innerHTML = '<p class="notice-empty">University notices and important academic updates will appear here.</p>';
  }
}

/* ================= CALENDAR ================= */
async function loadCalendar() {
  const calendarBox = document.querySelector('.calendar-box');
  if (!calendarBox) return;

  try {
    const res = await fetch(`${BASE_URL}/data/calendar.json`);
    if (!res.ok) throw new Error('Failed to load calendar');
    
    const events = await res.json();
    
    if (!events || events.length === 0) {
      calendarBox.innerHTML = '<p class="calendar-empty">No upcoming events at this time.</p>';
      return;
    }

    // Sort by date (upcoming first)
    const today = new Date();
    const upcomingEvents = events
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (upcomingEvents.length === 0) {
      calendarBox.innerHTML = '<p class="calendar-empty">No upcoming events at this time.</p>';
      return;
    }

    // Display events
    calendarBox.innerHTML = '';
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'calendar-events';
    
    upcomingEvents.slice(0, 6).forEach(event => {
      const item = document.createElement('div');
      item.className = `calendar-event event-${event.type}`;
      
      item.innerHTML = `
        <div class="event-date">
          <span class="event-day">${getDay(event.date)}</span>
          <span class="event-month">${getMonth(event.date)}</span>
        </div>
        <div class="event-details">
          <span class="event-title">${event.title}</span>
          <span class="event-description">${event.description}</span>
        </div>
      `;
      
      eventsContainer.appendChild(item);
    });
    
    calendarBox.appendChild(eventsContainer);
    
    // Add auto-scroll if more than 3 events
    if (upcomingEvents.length > 3) {
      startAutoScroll(eventsContainer);
    }

  } catch (error) {
    console.error('Error loading calendar:', error);
    calendarBox.innerHTML = '<p class="calendar-empty">Academic calendar events will be displayed here.</p>';
  }
}

/* ================= AUTO SCROLL ================= */
function startAutoScroll(container) {
  let scrollPosition = 0;
  const scrollSpeed = 0.5; // pixels per frame
  const pauseDuration = 3000; // pause at top/bottom
  let isPaused = false;
  let direction = 1; // 1 for down, -1 for up
  let animationId = null;
  
  function scroll() {
    if (isPaused) {
      animationId = requestAnimationFrame(scroll);
      return;
    }
    
    scrollPosition += scrollSpeed * direction;
    container.scrollTop = scrollPosition;
    
    // Check if reached bottom
    if (scrollPosition >= container.scrollHeight - container.clientHeight) {
      isPaused = true;
      direction = -1;
      setTimeout(() => isPaused = false, pauseDuration);
    }
    
    // Check if reached top
    if (scrollPosition <= 0) {
      isPaused = true;
      direction = 1;
      setTimeout(() => isPaused = false, pauseDuration);
    }
    
    animationId = requestAnimationFrame(scroll);
  }
  
  // Pause on hover
  container.addEventListener('mouseenter', () => isPaused = true);
  container.addEventListener('mouseleave', () => isPaused = false);
  
  // Start scrolling
  animationId = requestAnimationFrame(scroll);
  
  // Return cleanup function
  return () => {
    if (animationId) cancelAnimationFrame(animationId);
  };
}

/* ================= UTILITIES ================= */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function getDay(dateStr) {
  const date = new Date(dateStr);
  return date.getDate();
}

function getMonth(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  loadCalendar();
});
