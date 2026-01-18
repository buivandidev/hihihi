// API Base URL
const API_URL = 'http://localhost:5179/api';

// State
let currentClassId = null;
let currentStudentId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadClasses();
    loadStudents();
    setupFormHandlers();
});

// Tab Management
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'classes') {
        loadClasses();
    } else {
        loadStudents();
    }
}

// Loading Indicator
function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} active`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ==================== CLASSES CRUD ====================

async function loadClasses() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/classes`);
        if (!response.ok) throw new Error('Failed to load classes');
        
        const classes = await response.json();
        displayClasses(classes);
    } catch (error) {
        showToast('Lỗi khi tải danh sách lớp: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayClasses(classes) {
    const tbody = document.querySelector('#classes-table tbody');
    tbody.innerHTML = '';
    
    classes.forEach(cls => {
        const row = `
            <tr>
                <td>${cls.id}</td>
                <td><strong>${cls.name}</strong></td>
                <td>${cls.description || '<em>Không có mô tả</em>'}</td>
                <td><span class="badge">${cls.students?.length || 0} sinh viên</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="editClass(${cls.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-danger" onclick="deleteClass(${cls.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function showClassModal(classId = null) {
    currentClassId = classId;
    const modal = document.getElementById('class-modal');
    const title = document.getElementById('class-modal-title');
    const form = document.getElementById('class-form');
    
    form.reset();
    
    if (classId) {
        title.textContent = 'Cập Nhật Lớp Học';
        loadClassData(classId);
    } else {
        title.textContent = 'Thêm Lớp Học';
    }
    
    modal.classList.add('active');
}

function closeClassModal() {
    document.getElementById('class-modal').classList.remove('active');
    currentClassId = null;
}

async function loadClassData(id) {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/classes/${id}`);
        if (!response.ok) throw new Error('Failed to load class');
        
        const cls = await response.json();
        document.getElementById('class-id').value = cls.id;
        document.getElementById('class-name').value = cls.name;
        document.getElementById('class-description').value = cls.description || '';
    } catch (error) {
        showToast('Lỗi khi tải thông tin lớp: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editClass(id) {
    showClassModal(id);
}

async function deleteClass(id) {
    if (!confirm('Bạn có chắc muốn xóa lớp này? Tất cả sinh viên trong lớp cũng sẽ bị xóa!')) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_URL}/classes/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete class');
        
        showToast('Xóa lớp thành công!', 'success');
        loadClasses();
    } catch (error) {
        showToast('Lỗi khi xóa lớp: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ==================== STUDENTS CRUD ====================

async function loadStudents() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/students`);
        if (!response.ok) throw new Error('Failed to load students');
        
        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        showToast('Lỗi khi tải danh sách sinh viên: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayStudents(students) {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const dob = new Date(student.dateOfBirth).toLocaleDateString('vi-VN');
        const row = `
            <tr>
                <td>${student.id}</td>
                <td><strong>${student.fullName}</strong></td>
                <td>${student.email}</td>
                <td>${dob}</td>
                <td>${student.class?.name || '<em>Chưa phân lớp</em>'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="editStudent(${student.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-danger" onclick="deleteStudent(${student.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function showStudentModal(studentId = null) {
    currentStudentId = studentId;
    const modal = document.getElementById('student-modal');
    const title = document.getElementById('student-modal-title');
    const form = document.getElementById('student-form');
    
    form.reset();
    
    // Load classes for dropdown
    await loadClassesForDropdown();
    
    if (studentId) {
        title.textContent = 'Cập Nhật Sinh Viên';
        loadStudentData(studentId);
    } else {
        title.textContent = 'Thêm Sinh Viên';
    }
    
    modal.classList.add('active');
}

function closeStudentModal() {
    document.getElementById('student-modal').classList.remove('active');
    currentStudentId = null;
}

async function loadClassesForDropdown() {
    try {
        const response = await fetch(`${API_URL}/classes`);
        if (!response.ok) throw new Error('Failed to load classes');
        
        const classes = await response.json();
        const select = document.getElementById('student-class');
        select.innerHTML = '<option value="">-- Chọn lớp --</option>';
        
        classes.forEach(cls => {
            select.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        });
    } catch (error) {
        showToast('Lỗi khi tải danh sách lớp: ' + error.message, 'error');
    }
}

async function loadStudentData(id) {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/students/${id}`);
        if (!response.ok) throw new Error('Failed to load student');
        
        const student = await response.json();
        document.getElementById('student-id').value = student.id;
        document.getElementById('student-fullname').value = student.fullName;
        document.getElementById('student-email').value = student.email;
        document.getElementById('student-dob').value = student.dateOfBirth.split('T')[0];
        document.getElementById('student-class').value = student.classId;
    } catch (error) {
        showToast('Lỗi khi tải thông tin sinh viên: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editStudent(id) {
    await showStudentModal(id);
}

async function deleteStudent(id) {
    if (!confirm('Bạn có chắc muốn xóa sinh viên này?')) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_URL}/students/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        showToast('Xóa sinh viên thành công!', 'success');
        loadStudents();
    } catch (error) {
        showToast('Lỗi khi xóa sinh viên: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ==================== FORM HANDLERS ====================

function setupFormHandlers() {
    // Class Form
    document.getElementById('class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('class-name').value,
            description: document.getElementById('class-description').value || null
        };
        
        if (currentClassId) {
            data.id = parseInt(currentClassId);
        }
        
        showLoading();
        try {
            const url = currentClassId 
                ? `${API_URL}/classes/${currentClassId}`
                : `${API_URL}/classes`;
            
            const method = currentClassId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to save class');
            
            showToast(currentClassId ? 'Cập nhật lớp thành công!' : 'Thêm lớp thành công!', 'success');
            closeClassModal();
            loadClasses();
        } catch (error) {
            showToast('Lỗi khi lưu lớp: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Student Form
    document.getElementById('student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            fullName: document.getElementById('student-fullname').value,
            email: document.getElementById('student-email').value,
            dateOfBirth: document.getElementById('student-dob').value,
            classId: parseInt(document.getElementById('student-class').value)
        };
        
        if (currentStudentId) {
            data.id = parseInt(currentStudentId);
        }
        
        showLoading();
        try {
            const url = currentStudentId 
                ? `${API_URL}/students/${currentStudentId}`
                : `${API_URL}/students`;
            
            const method = currentStudentId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to save student');
            
            showToast(currentStudentId ? 'Cập nhật sinh viên thành công!' : 'Thêm sinh viên thành công!', 'success');
            closeStudentModal();
            loadStudents();
        } catch (error) {
            showToast('Lỗi khi lưu sinh viên: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}
