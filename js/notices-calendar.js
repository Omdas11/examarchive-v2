/**
 * ExamArchive v2 — Notices & Calendar
 * Phase 1.0: Clean Architecture Reset
 * Month/Week-view calendar with Assam 2026 holidays
 */

/* ================= NOTICES ================= */
async function loadNotices() {
  const noticeBox = document.querySelector(".notice-box");
  if (!noticeBox) return;

  try {
    const res = await fetch("data/notices.json");
    if (!res.ok) throw new Error("Failed to load notices");
    
    const notices = await res.json();
    
    if (!notices || notices.length === 0) {
      noticeBox.innerHTML = '<p class="notice-empty">No notices available at this time.</p>';
      return;
    }

    notices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    noticeBox.innerHTML = '';
    notices.slice(0, 5).forEach(notice => {
      const item = document.createElement('div');
      item.className = 'notice-item';
      
      const priorityClass = notice.priority === 'high' ? 'priority-high' : '';
      
      item.innerHTML = `
        <div class="notice-header ${priorityClass}">
          <span class="notice-title">${notice.title}</span>
          <span class="notice-date">${formatNoticeDate(notice.date)}</span>
        </div>
        ${notice.description ? `<p class="notice-description">${notice.description}</p>` : ''}
      `;
      
      noticeBox.appendChild(item);
    });

  } catch (error) {
    console.error('Error loading notices:', error);
    noticeBox.innerHTML = '<p class="notice-empty">University notices will appear here.</p>';
  }
}

/* ================= CALENDAR ================= */

let calendarData = null;
let calendarMonth = new Date().getMonth(); // 0-indexed
let calendarYear = 2026;
let calendarFilter = 'all';
let calendarView = 'month'; // 'month' or 'week'
let calendarWeekStart = null; // Date object for current week start

/**
 * Parse date string as local date (avoiding timezone shift)
 * Input: "2026-01-26" → local Date for Jan 26 2026
 */
function parseLocalDate(dateStr) {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

async function loadCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  try {
    const res = await fetch('data/calendar/assam-2026.json');
    if (!res.ok) throw new Error('Failed to load calendar');
    
    calendarData = await res.json();
    calendarYear = calendarData.year || 2026;
    
    // Set to current month if in the calendar year
    const now = new Date();
    if (now.getFullYear() === calendarYear) {
      calendarMonth = now.getMonth();
    } else {
      calendarMonth = 0;
    }
    
    renderCalendar();
    setupCalendarNav();
    setupViewToggle();
    
  } catch (error) {
    console.error('Error loading calendar:', error);
    grid.innerHTML = '<p class="calendar-empty">Calendar data not available.</p>';
  }
}

/**
 * Get all events for a specific month, optionally filtered by category
 */
function getEventsForMonth(month) {
  if (!calendarData || !calendarData.categories) return [];
  
  const events = [];
  const cats = calendarData.categories;
  
  for (const [category, items] of Object.entries(cats)) {
    if (calendarFilter !== 'all' && calendarFilter !== category) continue;
    
    for (const item of items) {
      const d = parseLocalDate(item.date);
      if (d.getMonth() === month && d.getFullYear() === calendarYear) {
        events.push({
          ...item,
          category,
          day: d.getDate(),
          dayOfWeek: d.getDay()
        });
      }
    }
  }
  
  return events;
}

/**
 * Get all events for a specific week
 */
function getEventsForWeek(weekStart) {
  if (!calendarData || !calendarData.categories) return [];
  
  const events = [];
  const cats = calendarData.categories;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  for (const [category, items] of Object.entries(cats)) {
    if (calendarFilter !== 'all' && calendarFilter !== category) continue;
    
    for (const item of items) {
      const d = parseLocalDate(item.date);
      if (d >= weekStart && d < weekEnd) {
        events.push({
          ...item,
          category,
          day: d.getDate(),
          dayOfWeek: d.getDay(),
          dateObj: d
        });
      }
    }
  }
  
  return events;
}

/**
 * Render calendar based on current view mode
 */
function renderCalendar() {
  if (calendarView === 'week') {
    renderCalendarWeek();
  } else {
    renderCalendarMonth();
  }
}

/**
 * Render the month-view calendar grid
 */
function renderCalendarMonth() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid) return;
  
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (label) label.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;
  
  const events = getEventsForMonth(calendarMonth);
  const eventsByDay = {};
  events.forEach(e => {
    if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
    eventsByDay[e.day].push(e);
  });
  
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;
  
  const categoryColors = {
    gazetted: '#d32f2f',
    restricted: '#1976D2',
    other: '#388E3C'
  };
  
  let html = '<div class="cal-grid">';
  
  // Day headers
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  dayHeaders.forEach(d => {
    html += `<div class="cal-header">${d}</div>`;
  });
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-empty"></div>';
  }
  
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const hasEvents = eventsByDay[day];
    const isToday = isCurrentMonth && today.getDate() === day;
    
    let cls = 'cal-day';
    if (isToday) cls += ' cal-today';
    if (hasEvents) cls += ' cal-has-event';
    
    let dots = '';
    if (hasEvents) {
      dots = '<div class="cal-dots">';
      const cats = [...new Set(hasEvents.map(e => e.category))];
      cats.forEach(c => {
        dots += `<span class="cal-dot" style="background:${categoryColors[c] || '#999'}"></span>`;
      });
      dots += '</div>';
    }
    
    html += `<div class="${cls}" onclick="showDayEvents(${day})" data-day="${day}">${day}${dots}</div>`;
  }
  
  html += '</div>';
  grid.innerHTML = html;
}

/**
 * Render the week-view calendar
 */
function renderCalendarWeek() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid) return;
  
  // Initialize week start if not set
  if (!calendarWeekStart) {
    const now = new Date();
    calendarWeekStart = new Date(now);
    calendarWeekStart.setDate(now.getDate() - now.getDay()); // Start on Sunday
    calendarWeekStart.setHours(0, 0, 0, 0);
  }
  
  const weekEnd = new Date(calendarWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (label) {
    const startLabel = `${monthNames[calendarWeekStart.getMonth()]} ${calendarWeekStart.getDate()}`;
    const endLabel = `${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    label.textContent = `${startLabel} – ${endLabel}`;
  }
  
  const events = getEventsForWeek(calendarWeekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const categoryColors = {
    gazetted: '#d32f2f',
    restricted: '#1976D2',
    other: '#388E3C'
  };
  const categoryLabels = { gazetted: 'Gazetted Holiday', restricted: 'Restricted Holiday', other: 'Academic' };
  
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  let html = '<div class="cal-week-view">';
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(calendarWeekStart);
    dayDate.setDate(calendarWeekStart.getDate() + i);
    const isToday = dayDate.getTime() === today.getTime();
    const dayEvents = events.filter(e => e.dayOfWeek === i);
    
    let cls = 'cal-week-day';
    if (isToday) cls += ' cal-week-today';
    
    html += `<div class="${cls}">`;
    html += `<div class="cal-week-label">${dayHeaders[i]} <span class="cal-week-num">${dayDate.getDate()}</span></div>`;
    
    if (dayEvents.length > 0) {
      dayEvents.forEach(e => {
        html += `<div class="cal-week-event" style="border-left-color:${categoryColors[e.category] || '#999'}">
          <strong>${e.title}</strong>
          <small>${categoryLabels[e.category] || e.category}</small>
        </div>`;
      });
    }
    
    html += '</div>';
  }
  
  html += '</div>';
  grid.innerHTML = html;
}

/**
 * Show events for a clicked day
 */
function showDayEvents(day) {
  const detail = document.getElementById('calendarEventDetail');
  if (!detail) return;
  
  const events = getEventsForMonth(calendarMonth).filter(e => e.day === day);
  
  if (events.length === 0) {
    detail.style.display = 'none';
    return;
  }
  
  const categoryLabels = { gazetted: 'Gazetted Holiday', restricted: 'Restricted Holiday', other: 'Academic' };
  const categoryColors = { gazetted: '#d32f2f', restricted: '#1976D2', other: '#388E3C' };
  
  detail.style.display = 'block';
  detail.innerHTML = events.map(e => `
    <div style="
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-left: 4px solid ${categoryColors[e.category] || '#999'};
      background: var(--bg-soft, #f5f5f5);
      margin-bottom: 0.5rem;
    ">
      <strong>${e.title}</strong>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        ${e.date} · ${categoryLabels[e.category] || e.category}
      </div>
    </div>
  `).join('');
}

/**
 * Setup month/week navigation
 */
function setupCalendarNav() {
  const prev = document.getElementById('calPrev');
  const next = document.getElementById('calNext');
  
  if (prev) {
    prev.addEventListener('click', () => {
      if (calendarView === 'week') {
        calendarWeekStart.setDate(calendarWeekStart.getDate() - 7);
      } else {
        calendarMonth--;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      }
      renderCalendar();
    });
  }
  
  if (next) {
    next.addEventListener('click', () => {
      if (calendarView === 'week') {
        calendarWeekStart.setDate(calendarWeekStart.getDate() + 7);
      } else {
        calendarMonth++;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      }
      renderCalendar();
    });
  }
}

/**
 * Setup Month/Week view toggle
 */
function setupViewToggle() {
  const nav = document.querySelector('.calendar-month-nav');
  if (!nav) return;
  
  // Don't add if already exists
  if (document.getElementById('calViewToggle')) return;
  
  const toggleContainer = document.createElement('div');
  toggleContainer.id = 'calViewToggle';
  toggleContainer.className = 'cal-view-toggle';
  toggleContainer.innerHTML = `
    <button class="cal-view-btn active" data-view="month">Month</button>
    <button class="cal-view-btn" data-view="week">Week</button>
  `;
  
  nav.insertAdjacentElement('afterend', toggleContainer);
  
  toggleContainer.querySelectorAll('.cal-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleContainer.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calendarView = btn.dataset.view;
      
      if (calendarView === 'week' && !calendarWeekStart) {
        const now = new Date();
        calendarWeekStart = new Date(now);
        calendarWeekStart.setDate(now.getDate() - now.getDay());
        calendarWeekStart.setHours(0, 0, 0, 0);
      }
      
      renderCalendar();
    });
  });
}

/**
 * Filter calendar by category (called from HTML buttons)
 */
function filterCalendar(category, btn) {
  calendarFilter = category;
  
  // Update active button
  document.querySelectorAll('.calendar-controls .toggle-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  renderCalendar();
  
  // Hide event detail when filter changes
  const detail = document.getElementById('calendarEventDetail');
  if (detail) detail.style.display = 'none';
}

/* ================= UTILITIES ================= */
function formatNoticeDate(dateStr) {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  loadCalendar();
});
