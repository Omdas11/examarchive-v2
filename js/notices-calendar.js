/**
 * ExamArchive v2 — Notices & Calendar
 * Phase 1.0: Clean Architecture Reset
 * Month-view calendar with Assam 2026 holidays
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
    
    renderCalendarMonth();
    setupCalendarNav();
    
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
      const d = new Date(item.date);
      if (d.getMonth() === month && d.getFullYear() === calendarYear) {
        events.push({
          ...item,
          category,
          day: d.getDate()
        });
      }
    }
  }
  
  return events;
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
  
  let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center;">';
  
  // Day headers
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  dayHeaders.forEach(d => {
    html += `<div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); padding: 0.5rem 0;">${d}</div>`;
  });
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }
  
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const hasEvents = eventsByDay[day];
    const isToday = isCurrentMonth && today.getDate() === day;
    
    let cellStyle = `
      padding: 0.35rem;
      border-radius: 6px;
      cursor: ${hasEvents ? 'pointer' : 'default'};
      position: relative;
      min-height: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    `;
    
    if (isToday) {
      cellStyle += 'background: var(--red, #d32f2f); color: white; font-weight: 700;';
    } else if (hasEvents) {
      cellStyle += 'background: var(--bg-soft, #f5f5f5); font-weight: 600;';
    }
    
    let dots = '';
    if (hasEvents) {
      dots = '<div style="display: flex; gap: 2px; margin-top: 2px;">';
      const cats = [...new Set(hasEvents.map(e => e.category))];
      cats.forEach(c => {
        dots += `<span style="width: 5px; height: 5px; border-radius: 50%; background: ${categoryColors[c] || '#999'};"></span>`;
      });
      dots += '</div>';
    }
    
    html += `<div style="${cellStyle}" onclick="showDayEvents(${day})" data-day="${day}">${day}${dots}</div>`;
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
 * Setup month navigation
 */
function setupCalendarNav() {
  const prev = document.getElementById('calPrev');
  const next = document.getElementById('calNext');
  
  if (prev) {
    prev.addEventListener('click', () => {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderCalendarMonth();
    });
  }
  
  if (next) {
    next.addEventListener('click', () => {
      calendarMonth++;
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderCalendarMonth();
    });
  }
}

/**
 * Filter calendar by category (called from HTML buttons)
 */
function filterCalendar(category, btn) {
  calendarFilter = category;
  
  // Update active button
  document.querySelectorAll('.calendar-controls .toggle-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  renderCalendarMonth();
  
  // Hide event detail when filter changes
  const detail = document.getElementById('calendarEventDetail');
  if (detail) detail.style.display = 'none';
}

/* ================= UTILITIES ================= */
function formatNoticeDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  loadCalendar();
});
