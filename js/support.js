// js/support.js
// ============================================
// SUPPORT PAGE — Admin Application Form
// Moved from settings.js (Phase 2 cleanup)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("support-form-container");
  if (!container) return;

  // Wait for auth
  const session = window.AuthController
    ? await window.AuthController.waitForAuthReady()
    : null;

  if (!session) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: var(--bg-soft); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">🔒 Sign in to submit an admin application.</p>
        <button class="btn btn-primary" onclick="window.AvatarUtils?.handleSignIn()">
          Sign in with Google
        </button>
      </div>
    `;
    return;
  }

  const user = session.user;

  // Check if user already submitted a request
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (supabase) {
      const { data: existingRequest } = await supabase
        .from("admin_requests")
        .select("status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingRequest) {
        const statusContainer = document.getElementById("admin-request-status-container");
        const statusText = document.getElementById("admin-request-status-text");
        if (statusContainer && statusText) {
          const statusMap = {
            pending: "⏳ Pending review",
            approved: "✅ Approved",
            rejected: "❌ Rejected"
          };
          statusText.textContent = statusMap[existingRequest.status] || existingRequest.status;
          statusContainer.style.display = "block";
        }
      }
    }
  } catch (e) {
    // No existing request — show form
  }

  // Render form
  container.innerHTML = `
    <form id="admin-application-form" style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="form-field">
        <label for="admin-reason" style="font-weight: 600; display: block; margin-bottom: 0.3rem;">Why do you want to join? *</label>
        <textarea id="admin-reason" name="reason" rows="3" required placeholder="Tell us why you'd like to help manage ExamArchive..."
          style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font-family: inherit; resize: vertical;"></textarea>
      </div>
      <div class="form-field">
        <label for="admin-expertise" style="font-weight: 600; display: block; margin-bottom: 0.3rem;">Subject expertise</label>
        <input type="text" id="admin-expertise" name="subject_expertise" placeholder="e.g., Physics, Chemistry, Commerce"
          style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font-family: inherit;" />
      </div>
      <div class="form-field">
        <label for="admin-experience" style="font-weight: 600; display: block; margin-bottom: 0.3rem;">Experience</label>
        <textarea id="admin-experience" name="experience" rows="2" placeholder="Describe any relevant experience..."
          style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font-family: inherit; resize: vertical;"></textarea>
      </div>
      <div class="form-field">
        <label for="admin-portfolio" style="font-weight: 600; display: block; margin-bottom: 0.3rem;">Portfolio link (optional)</label>
        <input type="url" id="admin-portfolio" name="portfolio_link" placeholder="https://..."
          style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font-family: inherit;" />
      </div>
      <button type="submit" class="btn btn-primary" id="admin-application-submit">Submit Application</button>
      <p id="admin-application-status" class="form-status" style="display:none;"></p>
    </form>
  `;

  // Form submission
  const form = document.getElementById("admin-application-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById("admin-application-status");
    const submitBtn = document.getElementById("admin-application-submit");

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (!supabase) throw new Error("Service unavailable");

      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (!freshUser) throw new Error("Not authenticated");

      const reason = document.getElementById("admin-reason").value.trim();
      const subjectExpertise = document.getElementById("admin-expertise").value.trim();
      const experience = document.getElementById("admin-experience").value.trim();
      const portfolioLink = document.getElementById("admin-portfolio").value.trim();

      if (!reason) throw new Error("Please provide a reason");
      if (reason.length < 10) throw new Error("Please provide a more detailed reason (at least 10 characters)");

      const { error } = await supabase.from("admin_requests").insert({
        user_id: freshUser.id,
        reason,
        subject_expertise: subjectExpertise || null,
        experience: experience || null,
        portfolio_link: portfolioLink || null
      });

      if (error) throw error;

      statusEl.textContent = "✅ Application submitted successfully!";
      statusEl.style.display = "block";
      statusEl.style.color = "var(--color-success)";
      form.reset();
    } catch (err) {
      statusEl.textContent = "❌ " + (err.message || "Failed to submit");
      statusEl.style.display = "block";
      statusEl.style.color = "var(--color-error)";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });
});
