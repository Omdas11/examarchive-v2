// =====================================
// Avatar Popup Controller
// =====================================

const avatarPopup = document.getElementById('avatar-popup');
const avatarOverlay = document.getElementById('avatar-overlay');

/* Call this when avatar icon is clicked */
function openAvatarPopup() {
  avatarPopup.classList.remove('hidden');
  avatarOverlay.classList.remove('hidden');
  avatarPopup.setAttribute('aria-hidden', 'false');
}

/* Close popup */
function closeAvatarPopup() {
  avatarPopup.classList.add('hidden');
  avatarOverlay.classList.add('hidden');
  avatarPopup.setAttribute('aria-hidden', 'true');
}

/* Close on overlay click */
avatarOverlay?.addEventListener('click', closeAvatarPopup);

/* ESC key support (desktop) */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAvatarPopup();
  }
});
