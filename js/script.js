// ========== Profile Management with Photo Upload + localStorage ==========

const STORAGE_KEY = 'school_profiles';
const CURRENT_KEY = 'school_current_profile_id';
const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

const defaultProfiles = [
  {
    id: 'USR001',
    name: 'Admin User',
    email: 'admin@rehan-school.com',
    phone: '03001234501',
    role: 'Admin',
    photo: null
  }
];

let tempPhoto = null;

function getProfiles() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfiles));
    return [...defaultProfiles];
  }
  return JSON.parse(data);
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function getCurrentId() {
  return localStorage.getItem(CURRENT_KEY) || 'USR001';
}

function setCurrentId(id) {
  localStorage.setItem(CURRENT_KEY, id);
}

function generateUserId() {
  const profiles = getProfiles();
  const num = profiles.length + 1;
  return 'USR' + String(num).padStart(3, '0');
}

function getInitials(name) {
  if (!name) return '--';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return; }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF).');
      reject(new Error('Invalid file type'));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      alert('Image is too large. Maximum size is 2MB.');
      reject(new Error('File too large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function setAvatarDisplay(photo, name, avatarEl, imgEl) {
  if (photo) {
    imgEl.src = photo;
    imgEl.style.display = 'block';
    avatarEl.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    avatarEl.style.display = 'flex';
    avatarEl.textContent = getInitials(name);
  }
}

function renderCurrentProfile() {
  const profiles = getProfiles();
  const currentId = getCurrentId();
  let profile = profiles.find(p => p.id === currentId);

  if (!profile && profiles.length > 0) {
    profile = profiles[0];
    setCurrentId(profile.id);
  }

  const avatarEl = document.getElementById('avatar');
  const imgEl = document.getElementById('avatarImg');

  if (!profile) {
    document.getElementById('displayName').textContent = 'No Profile';
    document.getElementById('displayRole').textContent = '-';
    document.getElementById('displayUserId').textContent = '-';
    document.getElementById('displayEmail').textContent = '-';
    document.getElementById('displayPhone').textContent = '-';
    document.getElementById('displayRole2').textContent = '-';
    setAvatarDisplay(null, null, avatarEl, imgEl);
    return;
  }

  document.getElementById('displayName').textContent = profile.name;
  document.getElementById('displayRole').textContent = profile.role;
  document.getElementById('displayUserId').textContent = profile.id;
  document.getElementById('displayEmail').textContent = profile.email;
  document.getElementById('displayPhone').textContent = profile.phone;
  document.getElementById('displayRole2').textContent = profile.role;
  setAvatarDisplay(profile.photo, profile.name, avatarEl, imgEl);
}

function renderProfilesList() {
  const profiles = getProfiles();
  const currentId = getCurrentId();
  const grid = document.getElementById('profilesGrid');

  if (profiles.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>No profiles yet. Click <strong>+ Add Profile</strong> to create one.</p></div>';
    return;
  }

  grid.innerHTML = profiles.map(p => {
    const hasPhoto = !!p.photo;
    return `
    <div class="profile-item ${p.id === currentId ? 'active' : ''}" data-id="${p.id}">
      <div class="avatar-sm">
        ${hasPhoto ? '<img src="' + p.photo + '" alt="">' : getInitials(p.name)}
      </div>
      <div class="info">
        <h4>${escapeHtml(p.name)}</h4>
        <p>${escapeHtml(p.role)} · ${escapeHtml(p.id)}</p>
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-warning btn-edit" data-id="${p.id}" title="Edit">Edit</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${p.id}" title="Delete">Del</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.profile-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return;
      setCurrentId(item.dataset.id);
      renderAll();
    });
  });

  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });

  grid.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(btn.dataset.id);
    });
  });
}

function renderAll() {
  renderCurrentProfile();
  renderProfilesList();
}

function updatePhotoPreview(photo, name) {
  const initials = document.getElementById('photoPreviewInitials');
  const img = document.getElementById('photoPreviewImg');
  const removeBtn = document.getElementById('btnRemovePhoto');

  if (photo) {
    img.src = photo;
    img.style.display = 'block';
    initials.style.display = 'none';
    removeBtn.style.display = 'inline-flex';
  } else {
    img.style.display = 'none';
    initials.style.display = 'block';
    initials.textContent = getInitials(name || 'AU');
    removeBtn.style.display = 'none';
  }
}

const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
let isEditMode = false;

function openAddModal() {
  isEditMode = false;
  tempPhoto = null;
  document.getElementById('modalTitle').textContent = 'Add Profile';
  document.getElementById('btnSave').textContent = 'Save Profile';
  profileForm.reset();
  document.getElementById('editId').value = '';
  document.getElementById('userId').value = '';
  document.getElementById('photoInput').value = '';
  updatePhotoPreview(null, 'AU');
  profileModal.classList.add('show');
}

function openEditModal(id) {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === id);
  if (!profile) return;

  isEditMode = true;
  tempPhoto = profile.photo || null;
  document.getElementById('modalTitle').textContent = 'Edit Profile';
  document.getElementById('btnSave').textContent = 'Update Profile';
  document.getElementById('editId').value = profile.id;
  document.getElementById('name').value = profile.name;
  document.getElementById('email').value = profile.email;
  document.getElementById('phone').value = profile.phone;
  document.getElementById('role').value = profile.role;
  document.getElementById('userId').value = profile.id;
  document.getElementById('photoInput').value = '';
  updatePhotoPreview(tempPhoto, profile.name);
  profileModal.classList.add('show');
}

function closeProfileModal() {
  profileModal.classList.remove('show');
  tempPhoto = null;
}

document.getElementById('photoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    tempPhoto = await readFileAsDataURL(file);
    const name = document.getElementById('name').value || 'AU';
    updatePhotoPreview(tempPhoto, name);
  } catch (err) {
    e.target.value = '';
  }
});

document.getElementById('btnRemovePhoto').addEventListener('click', () => {
  tempPhoto = null;
  document.getElementById('photoInput').value = '';
  const name = document.getElementById('name').value || 'AU';
  updatePhotoPreview(null, name);
});

document.getElementById('name').addEventListener('input', () => {
  if (!tempPhoto) {
    updatePhotoPreview(null, document.getElementById('name').value);
  }
});

document.getElementById('photoInputCurrent').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const photo = await readFileAsDataURL(file);
    const profiles = getProfiles();
    const currentId = getCurrentId();
    const index = profiles.findIndex(p => p.id === currentId);
    if (index !== -1) {
      profiles[index].photo = photo;
      saveProfiles(profiles);
      renderAll();
    }
  } catch (err) {
    e.target.value = '';
  }
  e.target.value = '';
});

document.getElementById('btnChangePhoto').addEventListener('click', () => {
  document.getElementById('photoInputCurrent').click();
});

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const role = document.getElementById('role').value;
  let userId = document.getElementById('userId').value.trim();

  if (!name || !email || !phone || !role) {
    alert('Please fill all required fields.');
    return;
  }

  let profiles = getProfiles();

  if (isEditMode) {
    const editId = document.getElementById('editId').value;
    const index = profiles.findIndex(p => p.id === editId);
    if (index === -1) return;

    if (userId && userId !== editId) {
      if (profiles.some(p => p.id === userId)) {
        alert('User ID already exists. Please choose another.');
        return;
      }
      profiles[index].id = userId;
      if (getCurrentId() === editId) setCurrentId(userId);
    }

    profiles[index].name = name;
    profiles[index].email = email;
    profiles[index].phone = phone;
    profiles[index].role = role;
    profiles[index].photo = tempPhoto;
  } else {
    if (!userId) userId = generateUserId();
    if (profiles.some(p => p.id === userId)) {
      alert('User ID already exists. Please choose another or leave empty.');
      return;
    }
    profiles.push({
      id: userId,
      name,
      email,
      phone,
      role,
      photo: tempPhoto
    });
    setCurrentId(userId);
  }

  saveProfiles(profiles);
  closeProfileModal();
  renderAll();
});

const deleteModal = document.getElementById('deleteModal');
let deleteTargetId = null;

function openDeleteModal(id) {
  deleteTargetId = id;
  deleteModal.classList.add('show');
}

function closeDeleteModal() {
  deleteModal.classList.remove('show');
  deleteTargetId = null;
}

document.getElementById('btnConfirmDelete').addEventListener('click', () => {
  if (!deleteTargetId) return;

  let profiles = getProfiles();
  profiles = profiles.filter(p => p.id !== deleteTargetId);

  if (getCurrentId() === deleteTargetId) {
    if (profiles.length > 0) {
      setCurrentId(profiles[0].id);
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  }

  saveProfiles(profiles);
  closeDeleteModal();
  renderAll();
});

document.getElementById('btnAddProfile').addEventListener('click', openAddModal);
document.getElementById('btnEditProfile').addEventListener('click', () => {
  openEditModal(getCurrentId());
});
document.getElementById('btnDeleteProfile').addEventListener('click', () => {
  const id = getCurrentId();
  if (id) openDeleteModal(id);
});

document.getElementById('modalClose').addEventListener('click', closeProfileModal);
document.getElementById('btnCancel').addEventListener('click', closeProfileModal);
document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);

profileModal.addEventListener('click', (e) => {
  if (e.target === profileModal) closeProfileModal();
});
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

renderAll();
