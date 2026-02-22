// js/requests.js
// ============================================
// PAPER REQUESTS (BOUNTY BOARD)
// Create requests, upvote, admin mark fulfilled
// ============================================

(function () {
  let currentUser = null;
  let userRoleLevel = 0;
  let userPrimaryRole = null;

  async function init() {
    try {
      const supabase = await window.waitForSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user || null;

      if (currentUser) {
        userRoleLevel = await (window.RoleUtils?.getCurrentUserRoleLevel?.() || Promise.resolve(0));
        // Fetch primary_role for permission checks
        try {
          const { data: roleData } = await supabase
            .from('roles')
            .select('primary_role')
            .eq('user_id', currentUser.id)
            .single();
          userPrimaryRole = roleData?.primary_role || null;
        } catch (_) { /* optional */ }
      }

      renderFormSection();
      await loadRequests();
    } catch (err) {
      console.warn('[REQUESTS] Init error:', err);
    }
  }

  function renderFormSection() {
    const section = document.getElementById('requestFormSection');
    if (!section) return;

    if (!currentUser) {
      section.innerHTML = `
        <div class="auth-prompt">
          <p>🔒 Sign in to create or vote on paper requests</p>
        </div>
      `;
      return;
    }

    section.innerHTML = `
      <div class="request-form">
        <h2>Request a Paper</h2>
        <div class="form-row">
          <input type="text" id="reqPaperCode" placeholder="Paper code (e.g. CS-101)" maxlength="20" />
          <input type="number" id="reqYear" placeholder="Year" min="1990" max="2099" />
        </div>
        <textarea id="reqDescription" placeholder="Describe which paper you need..." maxlength="300"></textarea>
        <div class="form-actions">
          <button class="btn btn-red" id="submitRequestBtn">Submit Request</button>
        </div>
      </div>
    `;

    document.getElementById('submitRequestBtn')?.addEventListener('click', submitRequest);
  }

  async function submitRequest() {
    const paperCode = document.getElementById('reqPaperCode')?.value.trim();
    const year = parseInt(document.getElementById('reqYear')?.value);
    const description = document.getElementById('reqDescription')?.value.trim();

    if (!paperCode || !description) {
      showRequestMessage('Please fill in paper code and description.', 'error');
      return;
    }

    try {
      const supabase = await window.waitForSupabase();
      if (!supabase || !currentUser) return;

      const { error } = await supabase.from('paper_requests').insert({
        user_id: currentUser.id,
        paper_code: paperCode,
        year: isNaN(year) ? null : year,
        description: description
      });

      if (error) throw error;

      // Clear form
      document.getElementById('reqPaperCode').value = '';
      document.getElementById('reqYear').value = '';
      document.getElementById('reqDescription').value = '';

      await loadRequests();
    } catch (err) {
      showRequestMessage('Failed to submit request: ' + (err.message || 'Unknown error'), 'error');
    }
  }

  async function loadRequests() {
    const listEl = document.getElementById('requestsList');
    if (!listEl) return;

    try {
      const supabase = await window.waitForSupabase();
      if (!supabase) {
        listEl.innerHTML = '<p class="empty-requests">Unable to load requests.</p>';
        return;
      }

      const { data, error } = await supabase
        .from('paper_requests')
        .select('*')
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        listEl.innerHTML = '<p class="empty-requests">No paper requests yet. Be the first to request one!</p>';
        return;
      }

      // Check which ones user has voted on
      let userVotes = new Set();
      if (currentUser) {
        const { data: votes } = await supabase
          .from('paper_request_votes')
          .select('request_id')
          .eq('user_id', currentUser.id);
        if (votes) {
          votes.forEach(v => userVotes.add(v.request_id));
        }
      }

      listEl.innerHTML = data.map(req => renderRequestCard(req, userVotes.has(req.id))).join('');

      // Attach vote handlers
      listEl.querySelectorAll('[data-vote-id]').forEach(btn => {
        btn.addEventListener('click', () => toggleVote(btn.dataset.voteId, btn.dataset.hasVoted === 'true'));
      });

      // Attach admin fulfill handlers
      listEl.querySelectorAll('[data-fulfill-id]').forEach(btn => {
        btn.addEventListener('click', () => handleFulfill(btn.dataset.fulfillId));
      });
    } catch (err) {
      listEl.innerHTML = '<p class="empty-requests">Error loading requests.</p>';
    }
  }

  function renderRequestCard(req, hasVoted) {
    const statusClass = req.status || 'open';
    const dateStr = new Date(req.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="request-card">
        <div class="request-vote">
          <button data-vote-id="${req.id}" data-has-voted="${hasVoted}" class="${hasVoted ? 'voted' : ''}" ${!currentUser ? 'disabled' : ''} title="Upvote">${hasVoted ? '✓ Voted' : '▲'}</button>
          <span class="vote-count">${req.votes || 0}</span>
        </div>
        <div class="request-body">
          <h3>${escapeHtml(req.paper_code || 'Unknown')}${req.year ? ' — ' + req.year : ''}</h3>
          <p class="request-meta">${dateStr} · <span class="request-status ${statusClass}">${statusClass}</span></p>
          <p>${escapeHtml(req.description || '')}</p>
          ${['Founder', 'Admin', 'Senior Moderator', 'Moderator'].includes(userPrimaryRole) && req.status === 'open' ? `
            <div class="admin-actions">
              <button data-fulfill-id="${req.id}">✓ Mark Fulfilled</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async function toggleVote(requestId, hasVoted) {
    if (!currentUser) {
      alert("Please login to vote.");
      return;
    }

    // Find the vote button and disable during processing
    const safeId = CSS.escape(requestId);
    const btn = document.querySelector(`[data-vote-id="${safeId}"]`);
    if (!btn || btn.disabled) return;
    btn.disabled = true;

    // Optimistic UI update
    const countEl = btn.parentElement?.querySelector('.vote-count');
    const prevCount = parseInt(countEl?.textContent || '0');

    if (hasVoted) {
      btn.classList.remove('voted');
      btn.textContent = '▲';
      btn.dataset.hasVoted = 'false';
      if (countEl) countEl.textContent = Math.max(0, prevCount - 1);
    } else {
      btn.classList.add('voted');
      btn.textContent = '✓ Voted';
      btn.dataset.hasVoted = 'true';
      if (countEl) countEl.textContent = prevCount + 1;
    }

    try {
      const supabase = await window.waitForSupabase();
      if (!supabase) return;

      if (!hasVoted) {
        const { error } = await supabase.rpc('upvote_paper_request', {
          request_id_param: requestId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('remove_vote', {
          request_id_param: requestId
        });
        if (error) throw error;
      }
    } catch (err) {
      // Revert optimistic update on error
      if (hasVoted) {
        btn.classList.add('voted');
        btn.textContent = '✓ Voted';
        btn.dataset.hasVoted = 'true';
        if (countEl) countEl.textContent = prevCount;
      } else {
        btn.classList.remove('voted');
        btn.textContent = '▲';
        btn.dataset.hasVoted = 'false';
        if (countEl) countEl.textContent = prevCount;
      }
    } finally {
      btn.disabled = false;
    }
  }

  async function handleFulfill(requestId) {
    if (userRoleLevel < 75) return;

    try {
      const supabase = await window.waitForSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('paper_requests')
        .update({ status: 'fulfilled' })
        .eq('id', requestId);

      if (error) throw error;
      await loadRequests();
    } catch (err) {
      console.warn('[REQUESTS] Fulfill error:', err);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showRequestMessage(message, type) {
    const section = document.getElementById('requestFormSection');
    if (!section) return;

    // Remove existing message
    const existing = section.querySelector('.request-message');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'request-message';
    el.style.cssText = `padding:0.6rem 1rem;border-radius:8px;margin-bottom:0.75rem;font-size:0.85rem;border:1px solid ${type === 'error' ? 'var(--color-error)' : 'var(--color-success)'};color:${type === 'error' ? 'var(--color-error)' : 'var(--color-success)'};background:${type === 'error' ? 'rgba(244,67,54,0.06)' : 'rgba(76,175,80,0.06)'}`;
    el.textContent = message;
    section.insertBefore(el, section.firstChild);
    setTimeout(() => el.remove(), 5000);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }
})();
